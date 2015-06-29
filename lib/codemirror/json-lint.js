let CodeMirror  = require('codemirror');
let jsonlint    = require('durable-json-lint');
require('codemirror/addon/lint/lint');

CodeMirror.registerHelper('lint', 'json', text => {
  let {errors} = jsonlint(text);
  return errors.map(err => {
    return {
      from:     CodeMirror.Pos(err.lineNumber - 1, err.column),
      to:       CodeMirror.Pos(err.lineNumber - 1, err.column),
      message:  err.description || err.message
    };
  });
});
