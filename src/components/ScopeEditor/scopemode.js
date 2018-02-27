import CodeMirror from 'codemirror';
import 'codemirror/addon/lint/lint';

CodeMirror.registerHelper('lint', 'scopemode', text =>
  text
    .split('\n')
    .map((line, i) => {
      const match = /<\.>|<\.\.\.+>/.exec(line);

      if (match) {
        return {
          from: CodeMirror.Pos(i, match.index),
          to: CodeMirror.Pos(i, match.index + match[0].length),
          severity: 'warning',
          message: 'It is likely you want <..> here instead.'
        };
      }

      return null;
    })
    .filter(r => r !== null)
);

CodeMirror.defineSimpleMode('scopemode', {
  start: [
    { regex: /\*$/, token: 'star' },
    { regex: /:/, token: 'sep' },
    { regex: /\//, token: 'slash' },
    { regex: /<\.>/, token: 'mistake-param' },
    { regex: /<\.\.>/, token: 'param' },
    { regex: /<\.\.\.+>/, token: 'mistake-param' },
    { regex: /[^:/*(<.+>)][\x20-\x7e][^:/*(<.+>)]*/, token: 'kitchensink' }
  ]
});
