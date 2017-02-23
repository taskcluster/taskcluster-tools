import React from 'react';
import {findDOMNode} from 'react-dom';
import taskcluster from 'taskcluster-client';
import moment from 'moment';
import * as utils from '../../lib/utils';
import * as format from '../../lib/format';
import _ from 'lodash';
import ConfirmAction from '../../lib/ui/confirmaction';
import ScopeEditor from '../../lib/ui/scopeeditor';
import TimeInput from '../../lib/ui/timeinput';
import * as auth from '../../lib/auth';
import {
  Alert, OverlayTrigger, Tooltip, Modal, FormGroup, ControlLabel, FormControl, Button, Glyphicon, ButtonToolbar,
} from 'react-bootstrap';
import './clienteditor.less';

/** Create client editor/viewer (same thing) */
const ClientEditor = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        auth: taskcluster.Auth,
      },
      reloadOnProps: ['currentClientId'],
    }),
  ],

  propTypes: {
    // Method to reload a client in the parent
    reloadClientId: React.PropTypes.func.isRequired,
  },

  getDefaultProps() {
    return {
      // '' implies. "Create Client"
      currentClientId: '',
    };
  },

  getInitialState() {
    return {
      // Loading client or loaded client
      clientLoaded: false,
      clientError: null,
      client: null,
      // Edit or viewing current state
      editing: true,
      // Operation details, if currently doing anything
      working: false,
      error: null,
      showModal: true,
    };
  },

  /** Load initial state */
  load() {
    // If there is no currentClientId, we're creating a new client
    if (this.props.currentClientId === '') {
      const creds = auth.loadCredentials();
      const clientId = creds ? `${creds.clientId}/` : '';

      return {
        client: {
          clientId,
          expires: new Date(3017, 1, 1),
          description: '',
          scopes: [],
          expandedScopes: [],
        },
        accessToken: null,
        editing: true,
        working: false,
        error: null,
      };
    }

    // Load currentClientId, but avoid doing so after creating a new client
    if (this.state.client && this.state.client.clientId === this.props.currentClientId) {
      this.setState({
        editing: false,
        working: false,
        error: null,
      });

      return {};
    }

    return {
      client: this.auth.client(this.props.currentClientId),
      accessToken: null,
      editing: false,
      working: false,
      error: null,
    };
  },

  render() {
    // display errors from operations
    if (this.state.error) {
      return (
        <Alert bsStyle="danger" onDismiss={this.dismissError}>
          <strong>Error executing operation</strong> {this.state.error.toString()}
        </Alert>
      );
    }
    const isCreating = this.props.currentClientId === '' && this.state.accessToken === null;
    const isEditing = (isCreating || this.state.editing);
    let title = 'Create New Client';

    if (!isCreating) {
      title = isEditing ? 'Edit Client' : 'View Client';
    }

    const creds = auth.loadCredentials();
    const clientId = creds ? `${creds.clientId}/` : '';
    const tooltip = (
      <Tooltip id="clientId">
        You can create as many clients as you would like that begin with "{clientId}".
      </Tooltip>
    );

    return this.renderWaitFor('client') || (
      <div className="client-editor">
        <h4 style={{marginTop: 0}}>{title}</h4>
        <hr style={{marginBottom: 10}} />
        <div className="form-horizontal">
          {
            isCreating ? (
              <OverlayTrigger
                placement="bottom"
                trigger="focus"
                defaultOverlayShown={clientId !== ''}
                overlay={tooltip}>
                <FormGroup validationState={this.validClientId() ? 'success' : 'error'}>
                  <ControlLabel className="col-md-3">ClientId</ControlLabel>
                  <div className="col-md-9">
                    <FormControl
                      type="text"
                      ref="clientId"
                      placeholder="ClientId"
                      value={this.state.client.clientId}
                      onChange={this.onChange} />
                    <FormControl.Feedback />
                  </div>
                </FormGroup>
              </OverlayTrigger>
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
            ) :
            null
          }
          {
            (isEditing && !isCreating) || this.state.accessToken !== null ? (
              <div className="form-group">
                {(() => {
                  if (isEditing && !isCreating) {
                    return (
                      <div>
                        <label className="control-label col-md-3">AccessToken</label>
                        <div className="col-md-9">
                          <Button
                            bsStyle="warning"
                            onClick={this.resetAccessToken}
                            disabled={this.state.working}>
                            <Glyphicon glyph="fire" /> Reset accessToken
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  if (this.state.accessToken != null) {
                    return (
                      <Modal show={this.state.showModal} onHide={this.closeDialog}>
                        <Modal.Header closeButton={true}>Access Token</Modal.Header>
                        <Modal.Body>
                          <p>The access token for this clientId is:</p>
                          <code>{this.state.accessToken}</code>
                        </Modal.Body>
                      </Modal>
                    );
                  }
                })()}
              </div>
            ) :
            null
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
              {
                isEditing ? (
                  <TimeInput
                    format="YYYY-MM-DD HH:mm:ss ZZ"
                    value={moment(new Date(this.state.client.expires))}
                    onChange={this.onExpiresChange}
                    className="form-control" />
                ) : (
                  <div className="form-control-static">
                    <format.DateView date={this.state.client.expires} />
                  </div>
                )
              }
            </div>
          </div>
          {
            _.map({
              created: 'Created',
              lastModified: 'Last Modified',
              lastDateUsed: 'Last Date Used',
              lastRotated: 'Last Rotated',
            }, (label, prop) => {
              if (!this.state.client[prop]) {
                return;
              }

              return (
                <div className="form-group" key={prop}>
                  <label className="control-label col-md-3">{label}</label>
                  <div className="col-md-9">
                    <div className="form-control-static">
                      <format.DateView date={this.state.client[prop]} />
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
          {
            !isEditing && !isCreating ? (
              <div className="form-group">
                <label className="control-label col-md-3">Expanded Scopes</label>
                <div className="col-md-9">
                  <span className="text-muted">Expanded scopes are determined from the client
                    scopes, expanding roles for scopes beginning with <code>assume:</code>.
                  </span>
                  <ScopeEditor scopes={this.state.client.expandedScopes} />
                </div>
              </div>
            ) :
            null
          }
          <hr />
          <div className="form-group">
            <div className="col-md-9 col-md-offset-3">
              <div className="form-control-static">
                {(() => {
                  if (isEditing) {
                    return isCreating ?
                      this.renderCreatingToolbar() :
                      this.renderEditingToolbar();
                  }

                  return (
                    <ButtonToolbar>
                      <Button
                        bsStyle="success"
                        onClick={this.startEditing}
                        disabled={this.state.working}>
                        <Glyphicon glyph="pencil" /> Edit Client
                      </Button>
                    </ButtonToolbar>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },

  /** Determine if clientId is valid */
  validClientId() {
    return /^[A-Za-z0-9@\/:._-]+$/.test(this.state.client.clientId || '');
  },

  /** Render editing toolbar */
  renderEditingToolbar() {
    return (
      <ButtonToolbar>
        <Button bsStyle="success" onClick={this.saveClient} disabled={this.state.working}>
          <Glyphicon glyph="ok" /> Save Changes
        </Button>
        <ConfirmAction
          buttonStyle="danger"
          glyph="trash"
          disabled={this.state.working}
          label="Delete Client"
          action={this.deleteClient}
          success="Client deleted">
          Are you sure you want to delete credentials with client ID <code>{this.state.client.clientId}</code>?
        </ConfirmAction>
        {
          this.state.client.disabled ? (
            <ConfirmAction
              buttonStyle="warning"
              glyph="ok-circle"
              disabled={this.state.working}
              label="Enable Client"
              action={this.enableClient}
              success="Client enabled">
              Are you sure you want to enable client ID <code>{this.state.client.clientId}</code>?
            </ConfirmAction>
          ) : (
            <ConfirmAction
              buttonStyle="warning"
              glyph="remove-circle"
              disabled={this.state.working}
              label="Disable Client"
              action={this.disableClient}
              success="Client disabled">
              Are you sure you want to disable client ID <code>{this.state.client.clientId}</code>?
            </ConfirmAction>
          )
        }
      </ButtonToolbar>
    );
  },

  /** Render creation toolbar */
  renderCreatingToolbar() {
    return (
      <ButtonToolbar>
        <Button
          bsStyle="primary"
          onClick={this.createClient}
          disabled={this.state.working || !this.validClientId()}>
          <Glyphicon glyph="plus" /> Create Client
        </Button>
      </ButtonToolbar>
    );
  },

  /** Render description editor */
  renderDescEditor() {
    return (
      <textarea
        className="form-control"
        ref="description"
        value={this.state.client.description}
        onChange={this.onChange}
        rows={8}
        placeholder="Description in markdown..." />
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
    const state = _.cloneDeep(this.state);

    state.client.description = findDOMNode(this.refs.description).value;

    if (this.refs.clientId) {
      state.client.clientId = findDOMNode(this.refs.clientId).value;
    }

    this.setState(state);
  },

  scopesUpdated(scopes) {
    const client = _.cloneDeep(this.state.client);

    client.scopes = scopes;
    this.setState({client});
  },

  /** When expires exchanges in the editor */
  onExpiresChange(date) {
    const state = _.cloneDeep(this.state);

    state.client.expires = date.toDate().toJSON();
    this.setState(state);
  },

  /** Reset accessToken for current client */
  async resetAccessToken() {
    try {
      const client = await this.auth.resetAccessToken(this.state.client.clientId);

      this.loadState({
        client,
        accessToken: client.accessToken,
        editing: false,
        working: false,
      });
    } catch (err) {
      this.setState({
        working: false,
        error: ': Sorry, you are not logged in. You need to be logged in to reset access tokens. \n ' + err,
      });
    }
  },

  /** Close modal */
  closeDialog() {
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
      const clientId = this.state.client.clientId;
      const client = await this.auth.createClient(clientId, {
        description: this.state.client.description,
        expires: this.state.client.expires,
        scopes: this.state.client.scopes,
      });

      this.setState({
        client,
        accessToken: client.accessToken,
        editing: false,
        working: false,
        error: null,
      });

      this.props.reloadClientId(clientId);
    } catch (err) {
      this.setState({
        working: false,
        error: err,
      });
    }
  },

  /** Save current client */
  saveClient() {
    const clientId = this.state.client.clientId;

    this.loadState({
      editing: false,
      client: this.auth
        .updateClient(clientId, {
          description: this.state.client.description,
          expires: this.state.client.expires,
          scopes: this.state.client.scopes,
        })
        .then(client => {
          this.props.reloadClientId(clientId);
          return client;
        }),
    });
  },

  /** Delete current client */
  async deleteClient() {
    const clientId = this.state.client.clientId;

    await this.auth.deleteClient(clientId);
    await this.props.reloadClientId(clientId);
  },

  async disableClient() {
    const clientId = this.state.client.clientId;

    await this.auth.disableClient(clientId);
    await this.reload();
  },

  async enableClient() {
    const clientId = this.state.client.clientId;

    await this.auth.enableClient(clientId);
    await this.reload();
  },

  /** Reset error state from operation*/
  dismissError() {
    this.setState({
      working: false,
      error: null,
    });
  },
});

export default ClientEditor;
