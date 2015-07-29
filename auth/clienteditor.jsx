var React           = require('react');
var bs              = require('react-bootstrap');
var slugid          = require('slugid');
var taskcluster     = require('taskcluster-client');
var DateTimePicker  = require('react-widgets').DateTimePicker;
var utils           = require('../lib/utils');
var format          = require('../lib/format');
var _               = require('lodash');
var ConfirmAction   = require('../lib/ui/confirmaction');
var Promise         = require('promise');

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

  propTypes: {
    // Method to refresh client list
    refreshClientList:  React.PropTypes.func.isRequired
  },

  getDefaultProps: function() {
    return {
      currentClientId:  undefined     // undefined implies. "Create Client"
    };
  },

  getInitialState: function() {
    return {
      // Loading client or loaded client
      clientLoaded:     false,
      clientError:      undefined,
      client:           undefined,
      // Edit or viewing current state
      editing:          true,
      // Operation details, if currently doing anything
      working:          false,
      error:            null
    };
  },

  /** Load initial state */
  load: function() {
    // If there is no currentClientId, we're creating a new client
    if (!this.props.currentClientId) {
      return {
        client: {
          clientId:       slugid.v4(),
          accessToken:    '-',
          scopes:         [],
          expires:        new Date(3015, 1, 1),
          name:           "",
          description:    ""
        },
        newAccessToken:   '',
        editing:          true,
        working:          false,
        error:            null
      };
    } else {
      // Load currentClientId
      return {
        client:           this.auth.client(this.props.currentClientId),
        newAccessToken:   '',
        editing:          false,
        working:          false,
        error:            null
      };
    }
  },

  render: function() {
    // display errors from operations
    if (this.state.error) {
      return (
        <bs.Alert bsStyle="danger" onDismiss={this.dismissError}>
          <strong>Error executing operation</strong>
          {this.state.error.toString()}
        </bs.Alert>
      );
    }
    var isCreating          = this.props.currentClientId === undefined;
    var isEditing           = (isCreating || this.state.editing);
    var haveNewAccessToken  = this.state.newAccessToken != '';
    var title               = "Create New Client";
    if (!isCreating) {
      title = (isEditing ? "Edit Client" : "View Client");
    }
    return this.renderWaitFor('client') || (
      <span className="client-editor">
        <h3>{title}</h3>
        <hr style={{marginBottom: 10}}/>
        <div className="form-horizontal">
          <div className="form-group">
            <label className="control-label col-md-3">ClientId</label>
            <div className="col-md-9">
              <div className="form-control-static">
                <code>{this.state.client.clientId}</code>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">AccessToken</label>
            <div className="col-md-9">
              {
                isEditing && !isCreating ?
                <bs.Button
                  bsStyle="warning"
                  bsSize="xsmall"
                  onClick={this.resetAccessToken}
                  disabled={this.state.working}>
                  <bs.Glyphicon glyph="fire"/>&nbsp;Reset
                </bs.Button>
                : haveNewAccessToken ?
                <div className="alert alert-danger alert-dismissible fade in"
                     role="alert">
                   <bs.Button className="close" aria-label="Close"
                           onClick={this.dismissAccessKey}>
                     <span aria-hidden="true">
                       ×
                     </span>
                   </bs.Button>

                   <code>
                     {this.state.newAccessToken}
                   </code>
                </div>
                :
                <span className="text-muted">
                  (hidden)
                </span>
              }
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
          <hr/>
          <div className="form-group">
            <div className="col-md-9 col-md-offset-3">
              <div className="form-control-static">
                {
                  isEditing ?
                    (isCreating ?
                        this.renderCreatingToolbar()
                      :
                        this.renderEditingToolbar()
                    )
                  :
                    <bs.ButtonToolbar>
                      <bs.Button bsStyle="success"
                                 onClick={this.startEditing}
                                 disabled={this.state.working}>
                        <bs.Glyphicon glyph="pencil"/>&nbsp;Edit Client
                      </bs.Button>
                    </bs.ButtonToolbar>
                }
              </div>
            </div>
          </div>
        </div>
      </span>
    );
  },

  /** Render editing toolbar */
  renderEditingToolbar() {
    return (
      <bs.ButtonToolbar>
        <bs.Button bsStyle="success"
                   onClick={this.saveClient}
                   disabled={this.state.working}>
          <bs.Glyphicon glyph="ok"/>&nbsp;Save Changes
        </bs.Button>
        <ConfirmAction
          buttonStyle='danger'
          glyph='trash'
          disabled={this.state.working}
          label="Delete Client"
          action={this.deleteClient}
          success="Client deleted">
          Are you sure you want to delete credentials with clientId&nbsp;
          <code>{this.state.client.clientId}</code>?
        </ConfirmAction>
      </bs.ButtonToolbar>
    );
  },

  /** Render creation toolbar */
  renderCreatingToolbar: function() {
    return (
      <bs.ButtonToolbar>
        <bs.Button bsStyle="primary"
                   onClick={this.createClient}
                   disabled={this.state.working}>
          <bs.Glyphicon glyph="plus"/>&nbsp;Create Client
        </bs.Button>
      </bs.ButtonToolbar>
    );
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
    state.client.description  = this.refs.description.getDOMNode().value;
    state.client.name         = this.refs.name.getDOMNode().value;
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
  },

  /** Reset accessToken for current client */
  resetAccessToken: function() {
    this.auth.resetCredentials(this.state.client.clientId)
    .then(function(client) {
      this.loadState({
        client:         client,
        newAccessToken: client.accessToken,
        editing:        false,
        working:        false
      });
    }.bind(this), function(err) {
      this.setState({
        working:  false,
        error:    err
      });
    }.bind(this));
  },

  /** dismiss the visible access key */
  dismissAccessKey: function() {
    this.setState({newAccessToken: ''});
  },

  /** Start editing */
  startEditing: function() {
    this.setState({editing: true});
  },

  /** Create new client */
  createClient: function() {
    this.setState({working: true});
    this.auth.createClient(this.state.client.clientId, {
      scopes:       this.state.client.scopes,
      name:         this.state.client.name,
      description:  this.state.client.description,
      expires:      this.state.client.expires,
    }).then(function(client) {
      this.setState({
        client:         client,
        newAccessToken: client.accessToken,
        editing:        false,
        working:        false,
        error:          null
      });
      this.props.refreshClientList();
      //this.reload();
    }.bind(this), function(err) {
      this.setState({
        working:  false,
        error:    err
      });
    }.bind(this));
  },

  /** Save current client */
  saveClient() {
    this.loadState({
      client:     this.auth.modifyClient(this.state.client.clientId, {
        scopes:       this.state.client.scopes,
        name:         this.state.client.name,
        description:  this.state.client.description,
        expires:      this.state.client.expires,
      }),
      editing:    false
    });
  },

  /** Delete current client */
  async deleteClient() {
    await this.auth.removeClient(this.state.client.clientId);
    await Promise.all([this.props.refreshClientList(), this.reload()]);
  },

  /** Reset error state from operation*/
  dismissError() {
    this.setState({
      working:      false,
      error:        null
    });
  }
});

// Export ClientEditor
module.exports = ClientEditor;

