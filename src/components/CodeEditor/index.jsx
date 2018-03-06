import { PureComponent } from 'react';
import { string } from 'prop-types';
import CodeMirror from '@skidding/react-codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/yaml/yaml';
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/lint/lint.css';
import './yaml-lint';
import './styles.css';

export default class CodeEditor extends PureComponent {
  constructor(props) {
    super(props);

    this.register = this.register.bind(this);
  }

  componentDidMount() {
    if (!this.codeMirror) {
      return;
    }

    const { height, width } = this.props;

    if (height || width) {
      this.codeMirror.setSize(width, height);
    }
  }

  register(ref) {
    this.codeMirror = ref ? ref.getCodeMirror() : null;
    this.codeMirrorInstance = ref ? ref.getCodeMirrorInstance() : null;
  }

  render() {
    const { value, onChange, mode, ...options } = this.props;

    return (
      <CodeMirror
        ref={this.register}
        value={value}
        onChange={onChange}
        options={{
          ...options,
          mode: mode === 'json' ? 'application/json' : mode
        }}
      />
    );
  }
}

CodeEditor.propTypes = {
  mode: string
};

CodeEditor.defaultProps = {
  lineNumbers: true,
  textAreaClassName: 'form-control',
  gutters: ['CodeMirror-lint-markers'],
  indentWithTabs: false,
  tabSize: 2,
  textAreaStyle: { minHeight: '20em' }
};
