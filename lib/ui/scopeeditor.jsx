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
      <div className="form-control-static">
        <ul style={{paddingLeft: 20}}>
          {
            scopes.map((scope, index) => {
              return (
                <li key={index}>
                  <code>{scope}</code>
                  &nbsp;
                  <bs.Button
                    className="role-editor-remove-scope-btn"
                    bsStyle="danger"
                    bsSize="xsmall"
                    onClick={this.removeScope.bind(this, index)}>
                    <bs.Glyphicon glyph="trash"/>
                  </bs.Button>
                </li>
              );
            }, this)
          }
        </ul>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="new-scope:for-something:*"
            ref="newScope"/>
          <span className="input-group-btn">
            <button className="btn btn-success"
                    type="button" onClick={this.addScope}>
              <bs.Glyphicon glyph="plus"/>
              &nbsp;
              Add
            </button>
          </span>
        </div>
      </div>
    );
  },

  /** Add scope to state */
  addScope() {
    var scope = this.refs.newScope.getDOMNode().value;
    // Let's skip empty strings
    if (scope) {
      var scopes = _.clone(this.props.scopes);
      if (scopes.indexOf(scope) == -1) {
        scopes.push(scope);
        scopes.sort();
        this.props.scopesUpdated(scopes);
      }
      this.refs.newScope.getDOMNode().value = "";
    }
  },

  /** Remove a scope from state */
  removeScope(index) {
    var scopes = _.clone(this.props.scopes);
    scopes.splice(index, 1);
    this.props.scopesUpdated(scopes);
  },

  /** Render a list of scopes */
  renderScopes() {
    var scopes = _.clone(this.props.scopes | []);
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
