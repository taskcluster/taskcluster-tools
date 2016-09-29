'use strict';

// Tools ESLint rules
// TODO: Move this into a neutrino-preset-taskcluster-web repo
module.exports = {
  extends: [require.resolve('neutrino-preset-react/src/eslint')],
  rules: {
    'react/no-find-dom-node': 'warn',
    // disable trailing commas in multiline object literals
    'comma-dangle': ['error', 'never'],
    'no-underscore-dangle': 'off',
    'no-mixed-operators': 'warn',
    'no-confusing-arrow': 'warn',
    'consistent-return': 'warn',
    'no-plusplus': 'off',
    'no-shadow': 'off',
    'class-methods-use-this': 'off',
    'no-template-curly-in-string': 'off',
    'no-return-assign': 'off'
  }
};
