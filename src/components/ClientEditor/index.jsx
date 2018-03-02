import { PureComponent } from 'react';
import { func } from 'prop-types';
import {
  OverlayTrigger,
  Tooltip,
  Modal,
  FormGroup,
  ControlLabel,
  FormControl,
  Button,
  Glyphicon,
  ButtonToolbar
} from 'react-bootstrap';
import { assoc } from 'ramda';
import Icon from 'react-fontawesome';
import Spinner from '../../components/Spinner';
import TimeInput from '../../components/TimeInput';
import ModalItem from '../../components/ModalItem';
import Markdown from '../../components/Markdown';
import DateView from '../../components/DateView';
import ScopeEditor from '../../components/ScopeEditor';
import Error from '../../components/Error';

export default class ClientEditor extends PureComponent {
  static propTypes = {
    // Method to reload a client in the parent
    onNavigate: func.isRequired,
    onDeleteClient: func
  };

  static defaultProps = {
    // '' implies. "Create Client"
    currentClientId: '',
    onDeleteClient: null
  };

  constructor(props) {
    super(props);

    this.state = {
      // Loading client or loaded client
      client: null,
      // Edit or viewing current state
      editing: true,
      // Operation details, if currently doing anything
      working: false,
      error: null,
      showModal: true
    };
  }

  componentWillMount() {
    this.load(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.currentClientId !== this.props.currentClientId) {
      this.load(nextProps);
    }
  }

  async load(props) {
    // If there is no currentClientId, we're creating a new client
    if (props.currentClientId === '') {
      const { clientPrefix } = props;
      const clientId = clientPrefix;

      return this.setState({
        client: {
          clientId,
          expires: new Date(3017, 1, 1),
          description: '',
          scopes: [],
          expandedScopes: []
        },
        accessToken: null,
        editing: true,
        working: false,
        error: null
      });
    }

    const onLoadError = err =>
      this.setState({
        client: null,
        error: err
      });

    if (
      this.state.client &&
      this.state.client.clientId === props.currentClientId
    ) {
      try {
        return this.setState({
          client: await props.auth.client(props.currentClientId),
          editing: false,
          working: false,
          error: null
        });
      } catch (err) {
        return onLoadError(err);
      }
    }

    try {
      this.setState({
        client: await props.auth.client(props.currentClientId),
        accessToken: null,
        editing: false,
        working: false,
        error: null
      });
    } catch (err) {
      onLoadError(err);
    }
  }

  handleDescriptionChange = e =>
    this.setState({
      client: assoc('description', e.target.value, this.state.client)
    });

  handleClientIdChange = e =>
    this.setState({
      client: assoc('clientId', e.target.value, this.state.client)
    });

  handleScopesUpdated = scopes =>
    this.setState({
      client: assoc('scopes', scopes, this.state.client)
    });

  /** When expires exchanges in the editor */
  handleExpiresChange = date =>
    this.setState({
      client: assoc('expires', date.toJSON(), this.state.client)
    });

  handleDOEChange = () =>
    this.setState({
      client: assoc(
        'deleteOnExpiration',
        !this.state.client.deleteOnExpiration,
        this.state.client
      )
    });

  /** Reset accessToken for current client */
  handleResetAccessToken = async () => {
    try {
      const client = await this.props.auth.resetAccessToken(
        this.state.client.clientId
      );

      this.setState({
        client,
        accessToken: client.accessToken,
        editing: false,
        working: false
      });
    } catch (err) {
      this.setState({
        working: false,
        error: this.props.credentials
          ? 'You do not have sufficient permission to reset access tokens for this user.'
          : 'You must be logged in and have permission to reset access tokens for this user.'
      });
    }
  };

  /** Close modal */
  handleCloseDialog = () => this.setState({ accessToken: null });

  /** Start editing */
  handleStartEditing = () => this.setState({ editing: true });

  /** Create new client */
  handleCreateClient = async () => {
    this.setState({ working: true });

    try {
      const { clientId } = this.state.client;
      const client = await this.props.auth.createClient(clientId, {
        description: this.state.client.description,
        expires: this.state.client.expires,
        scopes: this.state.client.scopes
      });

      this.setState(
        {
          client,
          accessToken: client.accessToken,
          editing: false,
          working: false,
          error: null
        },
        () => this.props.onNavigate(clientId)
      );
    } catch (err) {
      this.setState({
        working: false,
        error: err
      });
    }
  };

  /** Save current client */
  handleSaveClient = async () => {
    try {
      const { clientId } = this.state.client;
      const client = await this.props.auth.updateClient(clientId, {
        description: this.state.client.description,
        expires: this.state.client.expires,
        scopes: this.state.client.scopes,
        deleteOnExpiration: this.state.client.deleteOnExpiration
      });

      this.props.onNavigate(clientId);

      this.setState({
        editing: false,
        client
      });
    } catch (err) {
      this.setState({
        error: err
      });
    }
  };

  /** Delete current client */
  handleDeleteClient = async () => {
    try {
      const { clientId } = this.state.client;

      await this.props.onDeleteClient(clientId);
    } catch (err) {
      this.setState({
        error: err
      });
    }
  };

  handleDisableClient = async () => {
    try {
      const { clientId } = this.state.client;

      await this.props.auth.disableClient(clientId);
    } catch (err) {
      this.setState({ error: err });
    }
  };

  handleEnableClient = async () => {
    try {
      const { clientId } = this.state.client;

      await this.props.auth.enableClient(clientId);
    } catch (err) {
      this.setState({ error: err });
    }
  };

  /** Determine if clientId is valid */
  validClientId = () =>
    /^[A-Za-z0-9@/:._-]+$/.test(this.state.client.clientId || '');

  /** Render editing toolbar */
  renderEditingToolbar() {
    return (
      <ButtonToolbar>
        <Button
          bsStyle="success"
          onClick={this.handleSaveClient}
          disabled={this.state.working}>
          <Glyphicon glyph="ok" /> Save Changes
        </Button>
        <ModalItem
          button
          disabled={this.state.working}
          onSubmit={this.handleDeleteClient}
          onComplete={this.props.onNavigate}
          body={
            <span>
              Are you sure you want to delete credentials with client ID{' '}
              <code>{this.state.client.clientId}</code>?
            </span>
          }>
          <Icon name="trash" /> Delete Client
        </ModalItem>
        {this.state.client.disabled ? (
          <ModalItem
            button
            bsStyle="warning"
            disabled={this.state.working}
            onSubmit={this.handleEnableClient}
            onComplete={() => this.load(this.props)}
            body={
              <span>
                Are you sure you want to enable client ID{' '}
                <code>{this.state.client.clientId}</code>?
              </span>
            }>
            <Icon name="check-circle-o" /> Enable Client
          </ModalItem>
        ) : (
          <ModalItem
            button
            bsStyle="warning"
            disabled={this.state.working}
            onSubmit={this.handleDisableClient}
            onComplete={() => this.load(this.props)}
            body={
              <span>
                Are you sure you want to disable client ID{' '}
                <code>{this.state.client.clientId}</code>?
              </span>
            }>
            <Icon name="times-circle-o" /> Disable Client
          </ModalItem>
        )}
      </ButtonToolbar>
    );
  }

  /** Render creation toolbar */
  renderCreatingToolbar() {
    return (
      <ButtonToolbar>
        <Button
          bsStyle="primary"
          onClick={this.handleCreateClient}
          disabled={this.state.working || !this.validClientId()}>
          <Glyphicon glyph="plus" /> Create Client
        </Button>
      </ButtonToolbar>
    );
  }

  /** Render description editor */
  renderDescEditor() {
    return (
      <textarea
        className="form-control"
        value={this.state.client.description}
        onChange={this.handleDescriptionChange}
        rows={8}
        placeholder="Description in markdown..."
      />
    );
  }

  /** Render description */
  renderDesc() {
    return (
      <div className="form-control-static">
        <Markdown>{this.state.client.description}</Markdown>
      </div>
    );
  }

  render() {
    if (this.state.error) {
      return <Error error={this.state.error} />;
    }

    const isCreating =
      this.props.currentClientId === '' && this.state.accessToken === null;
    const isEditing = isCreating || this.state.editing;
    let title = 'Create New Client';

    if (!isCreating) {
      title = isEditing ? 'Edit Client' : 'View Client';
    }

    const clientId = this.props.clientPrefix;
    const tooltip = (
      <Tooltip id="clientId">
        You can create as many clients as you would like that begin with &quot;{
          clientId
        }&quot;.
      </Tooltip>
    );

    if (!this.state.client) {
      return <Spinner />;
    }

    return (
      <div className="client-editor">
        <h4 style={{ marginTop: 0 }}>{title}</h4>
        <hr style={{ marginBottom: 10 }} />
        <div className="form-horizontal">
          {isCreating ? (
            <OverlayTrigger
              placement="bottom"
              trigger="focus"
              overlay={tooltip}>
              <FormGroup
                validationState={this.validClientId() ? 'success' : 'error'}>
                <ControlLabel className="col-md-3">ClientId</ControlLabel>
                <div className="col-md-9">
                  <FormControl
                    type="text"
                    placeholder="ClientId"
                    value={this.state.client.clientId}
                    onChange={this.handleClientIdChange}
                  />
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
          )}
          {this.state.client.disabled ? (
            <div className="form-group">
              <label className="control-label col-md-3">Disabled</label>
              <div className="col-md-9">This client is disabled</div>
            </div>
          ) : null}
          {(isEditing && !isCreating) || this.state.accessToken !== null ? (
            <div className="form-group">
              {(() => {
                if (isEditing && !isCreating) {
                  return (
                    <div>
                      <label className="control-label col-md-3">
                        AccessToken
                      </label>
                      <div className="col-md-9">
                        <Button
                          bsStyle="warning"
                          onClick={this.handleResetAccessToken}
                          disabled={this.state.working}>
                          <Glyphicon glyph="fire" /> Reset accessToken
                        </Button>
                      </div>
                    </div>
                  );
                }

                if (this.state.accessToken !== null) {
                  return (
                    <Modal
                      show={this.state.showModal}
                      onHide={this.handleCloseDialog}>
                      <Modal.Header closeButton>Access Token</Modal.Header>
                      <Modal.Body>
                        <p>The access token for this clientId is:</p>
                        <code>{this.state.accessToken}</code>
                      </Modal.Body>
                    </Modal>
                  );
                }
              })()}
            </div>
          ) : null}
          <div className="form-group">
            <label className="control-label col-md-3">Description</label>
            <div className="col-md-9">
              {isEditing ? this.renderDescEditor() : this.renderDesc()}
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">Expires</label>
            <div className="col-md-9">
              {isEditing ? (
                <TimeInput
                  value={new Date(this.state.client.expires)}
                  onChange={this.handleExpiresChange}
                  className="form-control"
                />
              ) : (
                <div className="form-control-static">
                  <DateView date={this.state.client.expires} />
                  {this.state.client.deleteOnExpiration && (
                    <span> (this client will be deleted on expiration)</span>
                  )}
                </div>
              )}
            </div>
          </div>
          {isEditing && (
            <div className="form-group">
              <label className="control-label col-md-3">
                Delete on Expiration
              </label>
              <div className="col-md-9">
                <input
                  type="checkbox"
                  checked={this.state.client.deleteOnExpiration}
                  onChange={this.handleDOEChange}
                />{' '}
                Automatically delete this client when it expires
              </div>
            </div>
          )}
          {Object.entries({
            created: 'Created',
            lastModified: 'Last Modified',
            lastDateUsed: 'Last Date Used',
            lastRotated: 'Last Rotated'
          })
            .map(([prop, label]) => {
              if (!this.state.client[prop]) {
                return null;
              }

              return (
                <div className="form-group" key={prop}>
                  <label className="control-label col-md-3">{label}</label>
                  <div className="col-md-9">
                    <div className="form-control-static">
                      <DateView date={this.state.client[prop]} />
                    </div>
                  </div>
                </div>
              );
            })
            .filter(Boolean)}
          <div className="form-group">
            <label className="control-label col-md-3">Client Scopes</label>
            <div className="col-md-9">
              <ScopeEditor
                editing={isEditing}
                scopes={this.state.client.scopes}
                onScopesUpdated={this.handleScopesUpdated}
              />
            </div>
          </div>
          {!isEditing && !isCreating ? (
            <div className="form-group">
              <label className="control-label col-md-3">Expanded Scopes</label>
              <div className="col-md-9">
                <span className="text-muted">
                  Expanded scopes are determined from the client scopes,
                  expanding roles for scopes beginning with <code>assume:</code>.
                </span>
                <ScopeEditor scopes={this.state.client.expandedScopes} />
              </div>
            </div>
          ) : null}
          <hr />
          <div className="form-group">
            <div className="col-md-9 col-md-offset-3">
              <div className="form-control-static">
                {(() => {
                  if (isEditing) {
                    return isCreating
                      ? this.renderCreatingToolbar()
                      : this.renderEditingToolbar();
                  }

                  return (
                    <ButtonToolbar>
                      <Button
                        bsStyle="success"
                        onClick={this.handleStartEditing}
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
  }
}
