import React, {Component} from 'react';
import {findDOMNode} from 'react-dom';
import {Alert, Button, ButtonToolbar, Glyphicon} from 'react-bootstrap';
import {TaskClusterEnhance} from '../lib/utils';
import taskcluster from 'taskcluster-client';
import * as format from '../lib/format';
import ConfirmAction from '../lib/ui/confirmaction';
import TimeInput from '../lib/ui/timeinput';
import _ from 'lodash';
import moment from 'moment';

class SecretEditor extends Component {
  constructor(props) {
    super(props);

    this.state = {
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

    this.onExpiresChange = this.onExpiresChange.bind(this);
    this.startEditing = this.startEditing.bind(this);
    this.openSecret = this.openSecret.bind(this);
    this.saveSecret = this.saveSecret.bind(this);
    this.deleteSecret = this.deleteSecret.bind(this);
    this.showError = this.showError.bind(this);
    this.dismissError = this.dismissError.bind(this);
    this.load = this.load.bind(this);
    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
  }

  componentWillMount() {
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.addEventListener('taskcluster-reload', this.load, false);

    this.load();
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.removeEventListener('taskcluster-reload', this.load, false);
  }

  componentDidUpdate(prevProps, prevState) {
    this.props.taskclusterState(this.state, this.props);
  }

  onTaskClusterUpdate({detail}) {
    if (detail.name !== this.constructor.name) {
      return;
    }

    this.setState(detail.state);
  }

  load(data) {
    // A component may have nested components. `data.detail.name` will identify
    // which component (possibly nested) needs to load.
    if (typeof data === 'object' && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    // If there is currentSecretId, we load it. Otherwise we create a new secret
    const promisedState = this.props.currentSecretId === '' ?
      {
        secretId: '',
        secret: {
          secret: {},
          expires: taskcluster.fromNow('1 day'),
        },
        editing: true,
        working: false,
        error: null,
      } :
      {
        secretId: this.props.currentSecretId,
        secret: this.props.clients.secrets.get(this.props.currentSecretId),
        editing: false,
        working: false,
        error: null,
        showSecret: false
      };

    this.props.loadState(promisedState);
  }

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
        return this.props.renderWaitFor('secret') || null;
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
  }

  onExpiresChange(date) {
    const state = _.cloneDeep(this.state);

    state.secret.expires = date.toDate().toJSON();
    this.setState(state);
  }

  startEditing() {
    this.setState({editing: true});
  }

  openSecret() {
    this.setState({showSecret: true});
  }

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

    this.props.clients.secrets
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
          this.props.selectSecretId(secretId);
        }
      })
      .catch(this.showError);
  }

  async deleteSecret() {
    await this.props.clients.secrets
      .remove(this.props.currentSecretId)
      .then(() => this.props.reloadSecrets())
      .catch(this.showError);
  }

  showError(err) {
    this.setState({
      error: err,
      // clear the value, just to be safe
      value: null,
    });
  }

  dismissError() {
    this.setState({
      secretError: null,
      error: null,
    });
  }
}

SecretEditor.propTypes = {
  // Method to reload a client in the parent
  reloadSecrets: React.PropTypes.func.isRequired
};

// '' implies. "Create Secret"
SecretEditor.defaultProps = {
  currentSecretId: ''
};

const taskclusterOpts = {
  clients: {
    secrets: taskcluster.Secrets,
  },
  reloadOnProps: ['currentSecretId'],
  name: SecretEditor.name
};

export default TaskClusterEnhance(SecretEditor, taskclusterOpts);
