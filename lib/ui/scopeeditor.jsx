var React           = require('react');
var bs              = require('react-bootstrap');
var _               = require('lodash');

var ScopeEditor = React.createClass({
  propTypes: {
    // true to display the editor; expandedScopes can just display
    // by leaving this unset
    editing:        React.PropTypes.bool,
    scopes:         React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    // called when scopes have changed
    scopesUpdated:  React.PropTypes.func,
  },

  render() {
    if (this.props.editing) {
      return this.renderScopeEditor();
    } else {
      return this.renderScopes();
    }
  },

  /** Render scopes and associated editor */
  renderScopeEditor() {
    var scopes = _.clone(this.props.scopes || []);
    scopes.sort();
    return (
      <div>
        <textarea
          className="form-control"
          placeholder="new-scope:for-something:*"
          rows={scopes.length + 1}
          defaultValue={scopes.join("\n")}
          onChange={this.onChange}
          ref="scopeText"></textarea>
      </div>
    );
  },

  getScopesFromTextarea() {
    let newScopes = this.refs.scopeText.value.split(/[\r\n]+/);
    newScopes = Array.from(new Set(newScopes.filter(s => s != "")));
    newScopes.sort();
    return newScopes;
  },

  componentDidUpdate(prevProps, prevState) {
    // If we've gotten an update to the set of scopes, and it does
    // not correspond to what's in the textarea right now, update
    // the textarea, even at the cost of hurting user input
    if (!_.isEqual(this.props.scopes, prevProps.scopes) &&
        !_.isEqual(this.props.scopes, this.getScopesFromTextarea())) {
      this.refs.scopeText.value = this.props.scopes.join("\n");
    }
  },

  onChange() {
    let newScopes = this.getScopesFromTextarea();
    if (!_.isEqual(this.props.scopes, newScopes)) {
      this.props.scopesUpdated(newScopes);
    }
  },

  /** Render a list of scopes */
  renderScopes() {
    var scopes = _.clone(this.props.scopes || []);
    scopes.sort();
    return (
      <ul className="form-control-static" style={{paddingLeft: 20}}>
        {
          scopes.map(function(scope, index) {
            return <li key={index}><code>{scope}</code></li>;
          })
        }
      </ul>
    );
  },

})

module.exports = ScopeEditor;
