/** @jsx React.DOM */
var React           = require('react');
var bs              = require('react-bootstrap');
var slugid          = require('slugid');
var taskcluster     = require('taskcluster-client');
var DateTimePicker  = require('react-widgets').DateTimePicker;
var utils           = require('../lib/utils');
var format          = require('../lib/format');
var _               = require('lodash');

/** Create client editor/viewer (same thing) */
var ClientEditor = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        auth:       taskcluster.Auth
      },
      reloadOnProps: ['currentClientId']
    })
  ],

  getDefaultProps: function() {
    return {
      currentClientId:  undefined     // undefined implies. "Create Client"
    };
  },

  getInitialState: function() {
    return {
      clientLoaded:   false,
      clientError:    undefined,
      client:         undefined,
      editing:        true        // Editing or viewing
    };
  },

  /** Load initial state */
  load: function(props) {
    // If there is no currentClientId, we're creating a new client
    if (!props.currentClientId) {
      return {
        client: {
          clientId:       slugid.v4(),
          accessToken:    '-',
          scopes:         [],
          expires:        new Date(3015, 1, 1),
          name:           "",
          description:    ""
        },
        editing:          true
      };
    } else {
      // Load currentClientId
      return {
        client:           this.auth.client(props.currentClientId),
        editing:          false
      };
    }
  },

  render: function() {
    var isCreating = this.props.currentClientId === undefined;
    var isEditing  = (isCreating || this.state.editing);
    var title      = "Create New Client";
    if (!isCreating) {
      title = (isEditing ? "Edit Client" : "View Client");
    }
    return this.renderWaitFor('client') || (
      <span>
        <h3>{title}</h3>
        <hr style={{marginBottom: 10}}/>
        <div className="form-horizontal">
          <div className="form-group">
            <label className="control-label col-md-3">ClientId</label>
            <div className="col-md-9">
              <div className="form-control-static">
                &nbsp;<code>{this.state.client.clientId}</code>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">AccessToken</label>
            <div className="col-md-9">
              <div className="form-control-static">
                &nbsp;<code>{this.state.client.accessToken}</code>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">Name</label>
            <div className="col-md-9">
                {
                  isEditing ?
                    <input type="text"
                      className="form-control"
                      ref="name"
                      value={this.state.client.name}
                      onChange={this.onChange}
                      placeholder="Name"/>
                  :
                    <div className="form-control-static">
                      {this.state.client.name}
                    </div>
                }
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">Description</label>
            <div className="col-md-9">
              {isEditing ? this.renderDescEditor() : this.renderDesc()}
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">Expires</label>
            <div className="col-md-9">
              <div className="form-control-static">
                {
                  isEditing ?
                    <DateTimePicker
                      format='dd, MMM yyyy HH:mm'
                      value={new Date(this.state.client.expires)}
                      onChange={this.onExpiresChange}/>
                  :
                    <format.DateView date={this.state.client.expires}/>
                }
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">Scopes</label>
            <div className="col-md-9">
              {isEditing ? this.renderScopeEditor() : this.renderScopes()}
            </div>
          </div>
        </div>
        <hr style={{marginTop: 0}}/>
        <bs.ButtonToolbar className="pull-right" style={{paddingBottom: 20}}>
          <bs.Button bsStyle="primary">
            <bs.Glyphicon glyph="ok"/>&nbsp;Save Changes
          </bs.Button>
          <bs.Button bsStyle="warning">
            <bs.Glyphicon glyph="fire"/>&nbsp;Reset AccessToken
          </bs.Button>
          <bs.Button bsStyle="danger">
            <bs.Glyphicon glyph="trash"/>&nbsp;Delete Client
          </bs.Button>
        </bs.ButtonToolbar>
      </span>
    );
                  //<bs.Button bsStyle="primary">Create Client</bs.Button>
                  //<bs.Button bsStyle="warning">Edit Client</bs.Button>
  },

  /** Render description editor */
  renderDescEditor: function() {
    return (
      <textarea className="form-control"
                ref="description"
                value={this.state.client.description}
                onChange={this.onChange}
                rows={8}
                placeholder="Description in markdown...">
      </textarea>
    );
  },

  /** Render description */
  renderDesc: function() {
    return (
      <div className="form-control-static">
        <format.Markdown>{this.state.client.description}</format.Markdown>
      </div>
    );
  },

  /** Handle changes in the editor */
  onChange: function() {
    var state = _.cloneDeep(this.state);
    state.client.description  = this.refs.description.getValue();
    state.client.name         = this.refs.name.getValue();
    this.setState(state);
  },

  /** When expires exchanges in the editor */
  onExpiresChange: function(date) {
    if (date instanceof Date) {
      var state = _.cloneDeep(this.state);
      state.client.expires = date.toJSON();
      this.setState(state);
    }
  },

  /** Render scopes and associated editor */
  renderScopeEditor: function() {
    return (
      <div className="form-control-static">
        <ul style={{paddingLeft: 20}}>
          {
            this.state.client.scopes.map(function(scope, index) {
              return (
                <li key={index}>
                  <code>{scope}</code>
                  &nbsp;
                  <bs.Button
                    className="client-editor-remove-scope-btn"
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
  addScope: function() {
    var scope = this.refs.newScope.getDOMNode().value;
    // Let's skip empty strings
    if (scope) {
      var state = _.cloneDeep(this.state);
      state.client.scopes.push(scope);
      this.refs.newScope.getDOMNode().value = "";
      this.setState(state);
    }
  },

  /** Remove a scope from state */
  removeScope: function(index) {
    var state = _.cloneDeep(this.state);
    state.client.scopes.splice(index, 1);
    this.setState(state);
  },

  /** Render a list of scopes */
  renderScopes: function() {
    return (
      <ul className="form-control-static" style={{paddingLeft: 20}}>
        {
          this.state.client.scopes.map(function(scope, index) {
            return <li key={index}><code>{scope}</code></li>;
          })
        }
      </ul>
    );
  }
});

// Export ClientEditor
module.exports = ClientEditor;

