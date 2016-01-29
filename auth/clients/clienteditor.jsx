var React           = require('react');
var bs              = require('react-bootstrap');
var slugid          = require('slugid');
var taskcluster     = require('taskcluster-client');
var DateTimePicker  = require('react-widgets').DateTimePicker;
var utils           = require('../../lib/utils');
var format          = require('../../lib/format');
var _               = require('lodash');
var ConfirmAction   = require('../../lib/ui/confirmaction');
var Promise         = require('promise');
var ScopeEditor     = require('../../lib/ui/scopeeditor');

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
    // Method to reload a client in the parent
    reloadClientId:  React.PropTypes.func.isRequired
  },

  getDefaultProps() {
    return {
      currentClientId:  ''     // '' implies. "Create Client"
    };
  },

  getInitialState() {
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
  load() {
    // If there is no currentClientId, we're creating a new client
    if (this.props.currentClientId === '') {
      return {
        client: {
          clientId:       '',
          expires:        new Date(3017, 1, 1),
          description:    ""
        },
        accessToken:      null,
        editing:          true,
        working:          false,
        error:            null
      };
    } else {
      // Load currentClientId
      return {
        client:           this.auth.client(this.props.currentClientId),
        accessToken:      null,
        editing:          false,
        working:          false,
        error:            null
      };
    }
  },

  render() {
    // display errors from operations
    if (this.state.error) {
      return (
        <bs.Alert bsStyle="danger" onDismiss={this.dismissError}>
          <strong>Error executing operation</strong>&nbsp;
          {this.state.error.toString()}
        </bs.Alert>
      );
    }
    var isCreating          = this.props.currentClientId === '' &&
                              this.state.accessToken === null;
    var isEditing           = (isCreating || this.state.editing);
    var title               = "Create New Client";
    if (!isCreating) {
      title = (isEditing ? "Edit Client" : "View Client");
    }
    return this.renderWaitFor('client') || (
      <span className="client-editor">
        <h3>{title}</h3>
        <hr style={{marginBottom: 10}}/>
        <div className="form-horizontal">
          {
            isCreating ? (
              <bs.Input
                type="text"
                ref="clientId"
                value={this.state.client.clientId}
                bsStyle={this.validClientId() ? 'success' : 'error'}
                hasFeedback
                label="ClientId"
                labelClassName="col-md-3"
                wrapperClassName="col-md-9"
                onChange={this.onChange}
                placeholder="ClientId"/>
            ) : (
              <div className="form-group">
                <label className="control-label col-md-3">ClientId</label>
                <div className="col-md-9">
                  <div className="form-control-static">
                    {this.state.client.clientId}
                  </div>
                </div>
              </div>
            )
          }
          {
             this.state.client.disabled ? (
              <div className="form-group">
                <label className="control-label col-md-3">Disabled</label>
                <div className="col-md-9">
                  This client is disabled
                </div>
              </div>
            ) : undefined
          }
          {
            (isEditing && !isCreating) || this.state.accessToken !== null ? (
              <div className="form-group">
                <label className="control-label col-md-3">AccessToken</label>
                <div className="col-md-9">
                  {
                    isEditing && !isCreating ?
                    <bs.Button
                      bsStyle="warning"
                      onClick={this.resetAccessToken}
                      disabled={this.state.working}>
                      <bs.Glyphicon glyph="fire"/>&nbsp;Reset accessToken
                    </bs.Button>
                    : (
                      this.state.accessToken !== null ? (
                        <bs.Alert bsStyle="warning"
                               onDismiss={this.dismissAccessKey}
                               dismissAfter={5 * 60 * 1000}>
                          <code>{this.state.accessToken}</code>
                        </bs.Alert>
                      ) : undefined
                    )
                  }
                </div>
              </div>
            ) : undefined
          }
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
          {
            _.map({
              created: "Created",
              lastModified: "Last Modified",
              lastDateUsed: "Last Date Used",
              lastRotated: "Last Rotated",
            }, (label, prop) => {
              if (!this.state.client[prop]) {
                return undefined;
              }
              return (
                <div className="form-group" key={prop}>
                  <label className="control-label col-md-3">{label}</label>
                  <div className="col-md-9">
                    <div className="form-control-static">
                      <format.DateView date={this.state.client[prop]}/>
                    </div>
                  </div>
                </div>
              );
            })
          }
          <div className="form-group">
            <label className="control-label col-md-3">Client Scopes</label>
            <div className="col-md-9">
              <ScopeEditor
                editing={isEditing}
                scopes={this.state.client.scopes}
                scopesUpdated={this.scopesUpdated} />
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">Expanded Scopes</label>
            <div className="col-md-9">
              <span className="text-muted">Expanded scopes are determined from the client
                scopes, expanding roles for scopes beginning with <code>assume:</code>.
                The role <code>client-id:{this.state.client.clientId}</code> is implicitly
                included.</span>
              <ScopeEditor
                scopes={this.state.client.expandedScopes}/>
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

  /** Determine if clientId is valid */
  validClientId() {
    return /^[a-zA-Z0-9_-]+$/.test(this.state.client.clientId || '');
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
        { this.state.client.disabled ? (
          <ConfirmAction
            buttonStyle='warning'
            glyph='ok-circle'
            disabled={this.state.working}
            label="Enable Client"
            action={this.enableClient}
            success="Client enabled">
            Are you sure you want to enable clientId&nbsp;
            <code>{this.state.client.clientId}</code>?
          </ConfirmAction>
        ) : (
          <ConfirmAction
            buttonStyle='warning'
            glyph='remove-circle'
            disabled={this.state.working}
            label="Disable Client"
            action={this.disableClient}
            success="Client disabled">
            Are you sure you want to disable clientId&nbsp;
            <code>{this.state.client.clientId}</code>?
          </ConfirmAction>
        )}
      </bs.ButtonToolbar>
    );
  },

  /** Render creation toolbar */
  renderCreatingToolbar() {
    return (
      <bs.ButtonToolbar>
        <bs.Button bsStyle="primary"
                   onClick={this.createClient}
                   disabled={this.state.working || !this.validClientId()}>
          <bs.Glyphicon glyph="plus"/>&nbsp;Create Client
        </bs.Button>
      </bs.ButtonToolbar>
    );
  },

  /** Render description editor */
  renderDescEditor() {
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
  renderDesc() {
    return (
      <div className="form-control-static">
        <format.Markdown>{this.state.client.description}</format.Markdown>
      </div>
    );
  },

  /** Handle changes in the editor */
  onChange() {
    var state = _.cloneDeep(this.state);
    state.client.description = this.refs.description.getDOMNode().value;
    if (this.refs.clientId) {
      state.client.clientId = this.refs.clientId.getValue();
    }
    this.setState(state);
  },

  scopesUpdated(scopes) {
    var client = _.cloneDeep(this.state.client);
    client.scopes = scopes;
    this.setState({client});
  },


  /** When expires exchanges in the editor */
  onExpiresChange(date) {
    if (date instanceof Date) {
      var state = _.cloneDeep(this.state);
      state.client.expires = date.toJSON();
      this.setState(state);
    }
  },

  /** Reset accessToken for current client */
  async resetAccessToken() {
    try {
      let client = await this.auth.resetAccessToken(this.state.client.clientId);
      this.loadState({
        client:         client,
        accessToken:    client.accessToken,
        editing:        false,
        working:        false
      });
    } catch (err) {
      this.setState({
        working:  false,
        error:    err
      });
    }
  },

  /** dismiss the visible access key */
  dismissAccessKey() {
    this.setState({accessToken: null});
  },

  /** Start editing */
  startEditing() {
    this.setState({editing: true});
  },

  /** Create new client */
  async createClient() {
    this.setState({working: true});
    try {
      let clientId = this.state.client.clientId;
      let client = await this.auth.createClient(clientId, {
        description:  this.state.client.description,
        expires:      this.state.client.expires,
      });
      this.setState({
        client:         client,
        accessToken:    client.accessToken,
        editing:        false,
        working:        false,
        error:          null
      });
      this.props.reloadClientId(clientId);
    } catch (err) {
      this.setState({
        working:  false,
        error:    err
      });
    }
  },

  /** Save current client */
  saveClient() {
    let clientId = this.state.client.clientId;
    this.loadState({
      client: this.auth.updateClient(clientId, {
        description:  this.state.client.description,
        expires:      this.state.client.expires,
      }).then(client => {
        this.props.reloadClientId(clientId);
        return client;
      }),
      editing: false
    });
  },

  /** Delete current client */
  async deleteClient() {
    let clientId = this.state.client.clientId;
    await this.auth.deleteClient(clientId);
    await this.props.reloadClientId(clientId);
  },

  async disableClient() {
    let clientId = this.state.client.clientId;
    await this.auth.disableClient(clientId);
    await this.reload();
  },

  async enableClient() {
    let clientId = this.state.client.clientId;
    await this.auth.enableClient(clientId);
    await this.reload();
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

