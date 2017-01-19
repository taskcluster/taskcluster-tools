import React from 'react';
import {findDOMNode} from 'react-dom';
import _ from 'lodash';

const ScopeEditor = React.createClass({
  propTypes: {
    // true to display the editor; expandedScopes can just display
    // by leaving this unset
    editing: React.PropTypes.bool,
    scopes: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    // called when scopes have changed
    scopesUpdated: React.PropTypes.func,
  },

  render() {
    return this.props.editing ?
      this.renderScopeEditor() :
      this.renderScopes();
  },

  /** Render scopes and associated editor */
  renderScopeEditor() {
    const scopes = _.clone(this.props.scopes || []).sort();

    return (
      <div>
        <textarea
          className="form-control"
          placeholder="new-scope:for-something:*"
          rows={scopes.length + 1}
          defaultValue={scopes.join('\n')}
          onChange={this.onChange}
          ref="scopeText" />
      </div>
    );
  },

  getScopesFromTextarea() {
    const scopes = findDOMNode(this.refs.scopeText)
      .value
      .split(/[\r\n]+/)
      .map(s => s.trim())
      .filter(s => s !== '');

    return Array.from(new Set(scopes)).sort();
  },

  componentDidUpdate(prevProps) {
    // If we've gotten an update to the set of scopes, and it does
    // not correspond to what's in the textarea right now, update
    // the textarea, even at the cost of hurting user input
    const notEqual = !_.isEqual(this.props.scopes, prevProps.scopes) &&
      !_.isEqual(this.props.scopes, this.getScopesFromTextarea());

    if (notEqual) {
      findDOMNode(this.refs.scopeText).value = this.props.scopes.join('\n');
    }
  },

  onChange() {
    const newScopes = this.getScopesFromTextarea();

    if (!_.isEqual(this.props.scopes, newScopes)) {
      this.props.scopesUpdated(newScopes);
    }
  },

  /** Render a list of scopes */
  renderScopes() {
    const scopes = _.clone(this.props.scopes || []).sort();

    return (
      <ul className="form-control-static" style={{paddingLeft: 20}}>
        {scopes.map((scope, index) => <li key={index}><code>{scope}</code></li>)}
      </ul>
    );
  },
});

export default ScopeEditor;
