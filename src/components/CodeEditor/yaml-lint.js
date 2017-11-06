import CodeMirror from 'codemirror';
import { safeLoad } from 'js-yaml';
import 'codemirror/addon/lint/lint';

/*
  Override 'codemirror/addon/lint/yaml-lint' registerHelper so that it doesn't use window.jsyaml
  https://github.com/codemirror/CodeMirror/blob/master/addon/lint/yaml-lint.js
 */
CodeMirror.registerHelper('lint', 'yaml', text => {
  const found = [];

  try {
    safeLoad(text);
  } catch (e) {
    const loc = e.mark;

    found.push({
      from: CodeMirror.Pos(loc.line, loc.column),
      to: CodeMirror.Pos(loc.line, loc.column),
      message: e.message
    });
  }

  return found;
});
