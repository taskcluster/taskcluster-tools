const CodeMirror = require('codemirror');
require('codemirror/addon/lint/lint');
const yaml = require('js-yaml');

CodeMirror.registerHelper("lint", "yaml", function(text) {
  var found = [];
  try {
    yaml.safeLoad(text);
  } catch(e) {
    var loc = e.mark;
    found.push({
      from: CodeMirror.Pos(loc.line, loc.column),
      to: CodeMirror.Pos(loc.line, loc.column),
      message: e.message,
    });
  }
  return found;
});
