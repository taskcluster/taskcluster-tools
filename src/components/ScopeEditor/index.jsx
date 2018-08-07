import { Component } from 'react';
import { arrayOf, bool, func, string } from 'prop-types';
import equal from 'deep-equal';
import { Link } from 'react-router-dom';
import 'codemirror/addon/display/placeholder';
import 'codemirror/addon/lint/lint.css';
import 'codemirror/addon/mode/simple';
import CodeEditor from '../CodeEditor';
import './scopemode';
import './styles.css';

export default class ScopeEditor extends Component {
  static propTypes = {
    // true to display the editor; expandedScopes can just display
    // by leaving this unset
    editing: bool,
    scopes: arrayOf(string).isRequired,
    // called when scopes have changed
    onScopesUpdated: func
  };

  constructor(props) {
    super(props);

    this.state = {
      scopeText: props.scopes.join('\n')
    };
  }

  componentWillReceiveProps(nextProps) {
    // If we've gotten an update to the set of scopes, and it does
    // not correspond to what's in the textarea right now, update
    // the textarea, even at the cost of hurting user input
    const notEqual =
      !equal(nextProps.scopes, this.props.scopes) &&
      !equal(nextProps.scopes, this.parseScopes(this.state.scopeText));

    if (notEqual) {
      this.setState({ scopeText: nextProps.scopes.join('\n') });
    }
  }

  handleChange = scopeText => {
    const newScopes = this.parseScopes(scopeText);

    this.setState({ scopeText });

    if (!equal(this.props.scopes, newScopes)) {
      this.props.onScopesUpdated(newScopes);
    }
  };

  parseScopes(scopeText) {
    return [
      ...new Set(
        scopeText
          .split(/[\r\n]+/)
          .map(s => s.trim())
          .filter(Boolean)
      )
    ];
  }

  captureCodeEditor = ref => {
    this.codeEditor = ref;
  };

  /** Render scopes and associated editor */
  renderScopeEditor() {
    const { scopeText } = this.state;

    return (
      <div>
        <CodeEditor
          ref={this.captureCodeEditor}
          value={scopeText}
          onChange={this.handleChange}
          mode="scopemode"
          lint
          placeholder="new-scope:for-something:*"
        />
      </div>
    );
  }

  /** Render a list of scopes */
  renderScopes() {
    const { scopes } = this.props;

    return (
      <ul className="form-control-static" style={{ paddingLeft: 20 }}>
        {scopes.map(scope => (
          <li key={`scope-editor-${scope}`}>
            <Link to={`/auth/scopes/${encodeURIComponent(scope)}`}>
              <code>{scope}</code>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  render() {
    return this.props.editing ? this.renderScopeEditor() : this.renderScopes();
  }
}
