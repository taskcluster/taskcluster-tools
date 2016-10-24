import React from 'react';
import {findDOMNode} from 'react-dom';
import {Alert, Button, ButtonToolbar, Glyphicon} from 'react-bootstrap';
import * as utils from '../lib/utils';
import taskcluster from 'taskcluster-client';
import * as format from '../lib/format';
import ConfirmAction from '../lib/ui/confirmaction';
import TimeInput from '../lib/ui/timeinput';
import _ from 'lodash';
import moment from 'moment';

const SecretEditor = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        secrets: taskcluster.Secrets,
      },
      reloadOnProps: ['currentSecretId'],
    }),
  ],

  propTypes: {
    // Method to reload a client in the parent
    reloadSecrets: React.PropTypes.func.isRequired,
  },

  getDefaultProps() {
    return {
      // '' implies. "Create Secret"
      currentSecretId: '',
    };
  },

  getInitialState() {
    return {
      // Loading secret or loaded secret
      secretLoaded: false,
      secretError: null,
      secret: {},
      // Edit or viewing current state
      editing: true,
      // Operation details, if currently doing anything
      working: false,
      error: null,
      showSecret: false,
    };
  },

  /** Load initial state */
  load() {
    // If there is no currentSecretId, we're creating a new secret
    if (this.props.currentSecretId === '') {
      return {
        secretId: '',
        secret: {
          secret: {},
          expires: taskcluster.fromNow('1 day'),
        },
        editing: true,
        working: false,
        error: null,
      };
    }

    // Load currentSecretId
    return {
      secretId: this.props.currentSecretId,
      secret: this.secrets.get(this.props.currentSecretId),
      editing: false,
      working: false,
      error: null,
      showSecret: false,
    };
  },

  render() {
    try {
      // display errors from operations
      if (this.state.error || this.state.secretError) {
        const error = this.state.error || this.state.secretError;

        return (
          <Alert bsStyle="danger" onDismiss={this.dismissError}>
            <strong>Error executing operation</strong>
            <br />
            {error.toString()}
          </Alert>
        );
      }

      if (!this.state.secretLoaded) {
        return this.renderWaitFor('secret');
      }

      const isEditing = this.state.editing;
      const isCreating = isEditing && !this.props.currentSecretId;

      return (
        <div>
          <div className="form-horizontal">
            <div className="form-group">
              <label className="control-label col-md-2">Secret Name</label>
              <div className="col-md-10">
                {
                  isCreating ? (
                    <div>
                      <input
                        type="text"
                        className="form-control"
                        ref="name"
                        placeholder="garbage/<ircnick>/my-secret" />
                      <br />
                      <div className="alert alert-danger">
                        Secrets starting with <code>garbage/</code> are visible to just about
                        everybody. Use them to experiment, but not for real secrets!
                      </div>
                    </div>
                  ) : (
                    <div className="form-control-static">
                      {this.state.secretId}
                      {
                        this.state.secretId.startsWith('garbage/') ? (
                          <div className="alert alert-danger">
                            This is a "garbage" secret and is visible to just about everybody.
                            Do not put any real secrets here!
                          </div>
                        ) :
                        null
                      }
                    </div>
                  )
                }
              </div>
            </div>
            <div className="form-group">
              <label className="control-label col-md-2">Expires</label>
              <div className="col-md-10">
                {
                  isEditing ? (
                    <TimeInput
                      format="YYYY-MM-DD HH:mm:ss ZZ"
                      value={moment(new Date(this.state.secret.expires))}
                      onChange={this.onExpiresChange}
                      className="form-control" />
                  ) : (
                    <format.DateView date={this.state.secret.expires} />
                  )
                }
              </div>
            </div>
            <div className="form-group">
              <label className="control-label col-md-2">Secret Value (JSON Object)</label>
              <div className="col-md-10">
                {(() => {
                  // TODO: use the code editor
                  if (this.state.editing) {
                    return (
                      <textarea
                        rows="10"
                        className="form-control"
                        ref="value"
                        defaultValue={JSON.stringify(this.state.secret.secret, null, 2)} />
                    );
                  }

                  if (this.state.secret != null) {
                    if (this.state.showSecret) {
                      return <pre>{JSON.stringify(this.state.secret.secret, null, 2)}</pre>;
                    }

                    return (
                      <Button onClick={this.openSecret} bsStyle="warning">
                        <format.Icon name="user-secret" style={{padding: '.15em'}} /> Show secret
                      </Button>
                    );
                  }

                  return <em>none</em>;
                })()}
              </div>
            </div>
          </div>
          {
            isEditing ? (
              <ButtonToolbar>
                <Button bsStyle="success" onClick={this.saveSecret} disabled={this.state.working}>
                  <Glyphicon glyph="ok" /> {isCreating ? 'Create Secret' : 'Save Changes'}
                </Button>
                &nbsp;&nbsp;
                {
                  !isCreating && (
                    <ConfirmAction
                      buttonStyle="danger"
                      glyph="trash"
                      disabled={this.state.working}
                      label="Delete Secret"
                      action={this.deleteSecret}
                      success="Secret deleted">
                      Are you sure you want to delete secret <code>{this.state.secretId}</code>?
                    </ConfirmAction>
                  )
                }
              </ButtonToolbar>
            ) : (
              <ButtonToolbar>
                <Button bsStyle="success" onClick={this.startEditing} disabled={this.state.working}>
                  <Glyphicon glyph="pencil" /> Edit Secret
                </Button>
              </ButtonToolbar>
            )
          }
        </div>
      );
    } catch (e) {
      return <span>Error while rendering - see devtools for details</span>;
    }
  },

  onExpiresChange(date) {
    const state = _.cloneDeep(this.state);

    state.secret.expires = date.toDate().toJSON();
    this.setState(state);
  },

  startEditing() {
    this.setState({editing: true});
  },

  openSecret() {
    this.setState({showSecret: true});
  },

  async saveSecret() {
    let secretId = this.props.currentSecretId;
    let shouldReload = false;

    if (!secretId) {
      // adding a new secret, so reload to see it listed
      shouldReload = true;
      secretId = findDOMNode(this.refs.name).value;
    }

    if (!secretId) {
      return this.showError(new Error('secret name is required'));
    }

    let secret;

    try {
      secret = JSON.parse(findDOMNode(this.refs.value).value);
    } catch (e) {
      return this.showError(e);
    }

    const expires = this.state.secret.expires;

    this.secrets
      .set(secretId, {secret, expires})
      .then(() => {
        const newSecret = _.cloneDeep(this.state.secret);

        newSecret.secret = secret;
        newSecret.expires = expires;

        this.setState({
          secretId,
          editing: false,
          secret: newSecret,
        });

        if (shouldReload) {
          this.props.reloadSecrets();
        }
      })
      .catch(this.showError);
  },

  async deleteSecret() {
    await this.secrets
      .remove(this.props.currentSecretId)
      .then(() => this.props.reloadSecrets())
      .catch(this.showError);
  },

  showError(err) {
    this.setState({
      error: err,
      // clear the value, just to be safe
      value: null,
    });
  },

  dismissError() {
    this.setState({
      secretError: null,
      error: null,
    });
  },
});

export default SecretEditor;
