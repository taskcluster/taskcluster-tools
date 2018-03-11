import { reduce, pipe, xprod, map, unnest, toPairs, uniq } from 'ramda';

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

// cartesian product of multiple lists
// xproduct([[a, b], [1, 2], [C]]) == [[a, 1, C], [a, 2, C], [b, 1, C], [b, 2, C]]
const xproduct = reduce(pipe(xprod, map(unnest)), [[]]);
// escape string for save usage in regular expression
const escapeRegex = s => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
// Extract regular expression without ^ and $, and assert that it doesn't contain
// any capturing groups, and that it is fully anchored with ^ and $.
const extractRegExpAsString = re => {
  assert(re instanceof RegExp, 'expected a regular expression');
  const src = re.source;

  assert(
    src[0] === '^' && src[src.length - 1] === '$',
    'regular expression must be anchored'
  );
  const plain = src.slice(1, -1);

  assert(
    new RegExp(`^(?:|${plain})$`).exec('').length === 1,
    'regular expression must be non-capturing'
  );

  return plain;
};

// Given a set of arguments: [{param: value, ...}, {param: value, ...}], merge
// them and return the result; return null, if there are conflicting assignments.
const mergeArgumentSets = argumentSets => {
  const merged = {};
  let conflict = false;

  argumentSets.forEach(args => {
    Object.keys(args).forEach(param => {
      conflict = conflict || (merged[param] && merged[param] !== args[param]);
      merged[param] = args[param];
    });
  });

  if (conflict || argumentSets.length === 0) {
    return null;
  }

  return merged;
};

export const instantiate = ({ params, grants }, args) => {
  // Validate input
  Object.keys(params).forEach(param => {
    assert(
      params[param].exec(args[param]),
      `parameter ${param} was given illegal value ${args[param]}`
    );
  });

  // Pattern matching parameters
  const paramPattern = new RegExp(
    Object.keys(params)
      .map(p => `<(${escapeRegex(p)})>`)
      .join('|'),
    'g'
  );
  const parameterize = s =>
    s.replace(paramPattern, (orig, param) => args[param]);
  const result = {};

  Object.keys(grants).forEach(rolePattern => {
    result[parameterize(rolePattern)] = grants[rolePattern].map(parameterize);
  });

  return result;
};

/**
 * instantiatedArguments returns a list of arguments on the form
 * {param: value, ...} matching {param: regexp} from params, such that patterns
 * given in grants have been instantied as role/scope assignments in roles.
 */
export const instantiatedArguments = ({ params, grants }, roles = []) => {
  const paramPatterns = {};

  Object.keys(params).forEach(param => {
    paramPatterns[param] = extractRegExpAsString(params[param]);
  });

  // Pattern matching parameters
  const paramPattern = new RegExp(
    Object.keys(params)
      .map(p => `<(${escapeRegex(p)})>`)
      .join('|'),
    'g'
  );
  // makeMatcher takes a pattern containing <param> and returns a match function
  // such that match(str) = {<param>: value, ...} for each parameter, or null
  // if the string str doesn't match the pattern given.
  const makeMatcher = pattern => {
    assert(typeof pattern === 'string');
    const parameters = [];
    const r = pattern
      .split(paramPattern)
      .map((part, i) => {
        // even entries are raw text, odd entries are group matches
        if (i % 2 === 0) {
          return escapeRegex(part);
        }

        // Odd entries are parameter names
        parameters.push(part);

        return `(${paramPatterns[part]})`;
      })
      .join('');
    const re = new RegExp(`^${r}$`);

    return s => {
      const m = re.exec(s);

      if (!m) {
        return null;
      }

      const args = {};

      parameters.forEach((param, i) => {
        args[param] = m[i + 1];
      });

      return args;
    };
  };

  // For each {rolePattern: [...scopePatterns]} in grants (key/value pair in grants)
  // we find the possible set of arguments: {param: value, ...}, for which the
  // scopes matching scopePatterns have been granted to a role matching rolePattern
  const rolePatternArgSets = toPairs(grants).map(
    ([rolePattern, scopePatterns]) => {
      // Construct a function that will match rolePattern, by replacing <param>
      // with the regular expression for the param. The matcher will return the
      // arguments used in the string matched on the form: {param: value, ...}
      const roleMatch = makeMatcher(rolePattern);
      const scopeMatchers = scopePatterns.map(makeMatcher);

      return roles
        .filter(({ roleId }) => roleMatch(roleId))
        .map(({ roleId, scopes }) => {
          // Find a list of satisfied args for each scope pattern
          const scopePatternArgSets = scopeMatchers.map(m =>
            uniq(scopes.map(m).filter(a => a))
          );

          // We must satisfy one args for each scope pattern, as we have a
          // list of args per scope-pattern, this becomes cartesian product
          return xproduct([
            [roleMatch(roleId)], // args required by role pattern
            ...scopePatternArgSets // Array with args for each scope pattern
          ])
            .map(mergeArgumentSets)
            .filter(a => a);
        });
    }
  );

  // Find the arguments for which all {rolePattern: [...scopePatterns]} pairs
  // in grants have been instantiated. We have a list of arguments for each
  // rolePattern, so we just take cross-product, merge and filter out nulls.
  return xproduct(rolePatternArgSets)
    .map(mergeArgumentSets)
    .filter(a => a);
};
