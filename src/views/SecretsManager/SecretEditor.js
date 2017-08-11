import React from 'react';
import { func, object } from 'prop-types';
import { Alert, Button, ButtonToolbar, Glyphicon } from 'react-bootstrap';
import { fromNow } from 'taskcluster-client';
import Icon from 'react-fontawesome';
import equal from 'deep-equal';
import Spinner from '../../components/Spinner';
import TimeInput from '../../components/TimeInput';
import DateView from '../../components/DateView';
import CodeEditor from '../../components/CodeEditor';
import ModalItem from '../../components/ModalItem';

export default class SecretEditor extends React.PureComponent {
  static propTypes = {
    reloadSecrets: func.isRequired,
    secrets: object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      secretNameValue: '',
      secretValue: '{}',
      secret: null,
      expires: null,
      editing: true,
      working: false,
      error: null,
      showSecret: false
    };
  }

  componentWillMount() {
    this.loadSecret(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.secretId !== this.props.secretId) {
      this.loadSecret(nextProps);
    } else if (this.state.error && !equal(nextProps.credentials, this.props.credentials)) {
      this.setState({ error: null });
    }
  }

  async loadSecret(props) {
    // If there is a secretId, we load it. Otherwise we create a new secret
    if (!props.secretId) {
      return this.setState({
        secret: {},
        secretValue: '{}',
        expires: fromNow('1 day'),
        editing: true,
        working: false,
        error: null
      });
    }

    try {
      const { secret, expires } = await props.secrets.get(props.secretId);

      this.setState({
        secret,
        secretValue: JSON.stringify(secret),
        expires,
        editing: false,
        working: false,
        error: null,
        showSecret: false
      });
    } catch (err) {
      this.setState({
        error: err,
        secret: null,
        secretValue: null,
        expires: null
      });
    }
  }

  onExpiresChange = date => this.setState({
    expires: date.toJSON()
  });

  handleSecretNameChange = e => this.setState({ secretNameValue: e.target.value });

  handleValueChange = value => this.setState({ secretValue: value });

  startEditing = () => this.setState({ editing: true });

  openSecret = () => this.setState({ showSecret: true });

  saveSecret = async () => {
    const secretId = this.props.secretId || this.state.secretNameValue;
    const shouldReload = this.props.secretId !== secretId;

    if (!secretId) {
      return this.setState({ error: new Error('Secret name is required') });
    }

    try {
      const { expires, secretValue } = this.state;

      const secret = JSON.parse(secretValue);

      await this.props.secrets.set(secretId, { secret, expires });

      if (shouldReload) {
        this.props.selectSecretId(secretId);
      } else {
        this.setState({ error: null });
      }
    } catch (err) {
      this.setState({ error: err });
    }
  };

  deleteSecret = async () => {
    try {
      await this.props.secrets.remove(this.props.secretId);
    } catch (err) {
      this.setState({ error: err });
    }
  };

  dismissError = () => this.setState({ error: null });

  renderValue() {
    const { editing, secret, showSecret } = this.state;

    if (editing) {
      return <CodeEditor mode="json" value={JSON.stringify(secret, null, 2)} onChange={this.handleValueChange} />;
    }

    if (secret) {
      return showSecret ?
        <pre>{JSON.stringify(secret, null, 2)}</pre> :
        (
          <Button onClick={this.openSecret} bsStyle="warning">
            <Icon name="user-secret" style={{ padding: '.15em' }} /> Show secret
          </Button>
        );
    }

    return <em>none</em>;
  }

  render() {
    const { secretId } = this.props;
    const { error, secret, expires, editing, working, secretNameValue } = this.state;

    if (!secret && !error) {
      return <Spinner />;
    }

    const isCreating = editing && !secretId;

    return (
      <div>
        {error && (
          <Alert bsStyle="danger" onDismiss={this.dismissError}>
            <strong>Error executing operation</strong>
            <br />
            {error.toString()}
          </Alert>
        )}
        <div className="form-horizontal">
          <div className="form-group">
            <label className="control-label col-md-2">Secret Name</label>
            <div className="col-md-10">
              {
                isCreating ?
                  (
                    <div>
                      <input
                        type="text"
                        className="form-control"
                        required={true}
                        value={secretNameValue}
                        onChange={this.handleSecretNameChange}
                        placeholder="garbage/<ircnick>/my-secret" />
                      <br />
                      <div className="alert alert-warning">
                        Secrets starting with <code>garbage/</code> are visible to just about
                        everybody. Use them to experiment, but not for real secrets!
                      </div>
                    </div>
                  ) :
                  (
                    <div className="form-control-static">
                      {secretId}
                      {secretId.startsWith('garbage/') && (
                        <div className="alert alert-warning">
                          This is a &quot;garbage&quot; secret and is visible to just about everybody.
                          Do not put any real secrets here!
                        </div>
                      )}
                    </div>
                  )
              }
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-2">Expires</label>
            <div className="col-md-10">
              {
                editing ?
                  (
                    <TimeInput
                      value={new Date(expires)}
                      onChange={this.onExpiresChange}
                      className="form-control" />
                  ) :
                    <DateView date={expires} />
              }
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-2">Secret Value (JSON Object)</label>
            <div className="col-md-10">
              {this.renderValue()}
            </div>
          </div>
        </div>
        {
          editing ?
            (
              <ButtonToolbar>
                <Button bsStyle="success" onClick={this.saveSecret} disabled={working}>
                  <Glyphicon glyph="ok" /> {isCreating ? 'Create Secret' : 'Save Changes'}
                </Button>
                &nbsp;&nbsp;
                {!isCreating && (
                  <ModalItem
                    button={true}
                    bsStyle="danger"
                    onSubmit={this.deleteSecret}
                    onComplete={this.props.reloadSecrets}
                    disabled={working}
                    body={<span>Are you sure you want to delete secret <code>{secretId}</code>?</span>}>
                    <Icon name="trash" /> Delete Secret
                  </ModalItem>
                )}
              </ButtonToolbar>
            ) :
            (
              <ButtonToolbar>
                <Button bsStyle="success" onClick={this.startEditing} disabled={working}>
                  <Glyphicon glyph="pencil" /> Edit Secret
                </Button>
              </ButtonToolbar>
            )
        }
      </div>
    );
  }
}
