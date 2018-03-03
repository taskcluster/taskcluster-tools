import React from 'react';
import { func, object } from 'prop-types';
import { safeLoad, safeDump } from 'js-yaml';
import { Alert, Button, ButtonToolbar, Glyphicon } from 'react-bootstrap';
import { fromNow } from 'taskcluster-client-web';
import Icon from 'react-fontawesome';
import Spinner from '../../components/Spinner';
import Error from '../../components/Error';
import TimeInput from '../../components/TimeInput';
import DateView from '../../components/DateView';
import CodeEditor from '../../components/CodeEditor';
import ModalItem from '../../components/ModalItem';
import UserSession from '../../auth/UserSession';

const safeDumpOpts = { noCompatMode: true, noRefs: true };

export default class SecretEditor extends React.PureComponent {
  static propTypes = {
    reloadSecrets: func.isRequired,
    secrets: object.isRequired
  };

  state = {
    secretNameValue: '',
    secretValue: '',
    invalid: false,
    secret: null,
    expires: null,
    editing: true,
    loading: false,
    error: null,
    showSecret: false
  };

  componentWillMount() {
    this.loadSecret(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (
      UserSession.userChanged(this.props.userSession, nextProps.userSession)
    ) {
      this.setState({ error: null });
    }

    if (nextProps.secretId !== this.props.secretId) {
      this.loadSecret(nextProps);
    }
  }

  async loadSecret(props) {
    // If there is a secretId, we load it. Otherwise we create a new secret
    if (!props.secretId) {
      const defaultSecret = { foo: 'bar' };

      return this.setState({
        secret: defaultSecret,
        secretValue: safeDump(defaultSecret, safeDumpOpts),
        expires: fromNow('1000 years'),
        editing: true,
        loading: false,
        error: null
      });
    }

    // indicate loading while the async secret fetch occurs
    this.setState({
      loading: true,
      error: null
    });

    try {
      const { secret, expires } = await props.secrets.get(props.secretId);

      this.setState({
        secret,
        secretValue: safeDump(secret, safeDumpOpts),
        expires,
        editing: false,
        loading: false,
        error: null,
        showSecret: false
      });
    } catch (err) {
      this.setState({
        error: err,
        secret: null,
        secretValue: null,
        loading: false,
        expires: null
      });
    }
  }

  onExpiresChange = date =>
    this.setState({
      expires: date.toJSON()
    });

  handleSecretNameChange = e =>
    this.setState({ secretNameValue: e.target.value });

  handleValueChange = value => {
    try {
      safeLoad(value);
      this.setState({ invalid: false, secretValue: value });
    } catch (err) {
      this.setState({ invalid: true });
    }
  };

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
      const secret = safeLoad(secretValue);

      await this.props.secrets.set(secretId, { secret, expires });

      if (shouldReload) {
        this.props.selectSecretId(secretId);
      } else {
        this.loadSecret(this.props);
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
    const { editing, secret, secretValue, showSecret } = this.state;

    if (editing) {
      return (
        <CodeEditor
          lint={true}
          mode="yaml"
          value={secretValue}
          onChange={this.handleValueChange}
        />
      );
    }

    if (secret) {
      return showSecret ? (
        <pre>{safeDump(secret, safeDumpOpts)}</pre>
      ) : (
        <Button onClick={this.openSecret} bsStyle="warning">
          <Icon name="user-secret" style={{ padding: '.15em' }} /> Show secret
        </Button>
      );
    }

    return <em>none</em>;
  }

  render() {
    const { secretId } = this.props;
    const {
      error,
      expires,
      editing,
      invalid,
      loading,
      secretNameValue
    } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (loading) {
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
              {isCreating ? (
                <div>
                  <input
                    type="text"
                    className="form-control"
                    required={true}
                    value={secretNameValue}
                    onChange={this.handleSecretNameChange}
                    placeholder="garbage/<ircnick>/my-secret"
                  />
                  <br />
                  <div className="alert alert-warning">
                    Secrets starting with <code>garbage/</code> are visible to
                    just about everybody. Use them to experiment, but not for
                    real secrets!
                  </div>
                </div>
              ) : (
                <div className="form-control-static">
                  {secretId}
                  {secretId.startsWith('garbage/') && (
                    <div className="alert alert-warning">
                      This is a &quot;garbage&quot; secret and is visible to
                      just about everybody. Do not put any real secrets here!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-2">Expires</label>
            <div className="col-md-10">
              {editing ? (
                <TimeInput
                  value={new Date(expires)}
                  onChange={this.onExpiresChange}
                  className="form-control"
                />
              ) : (
                <DateView date={expires} />
              )}
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-2">
              Secret Value (YAML)
            </label>
            <div className="col-md-10">{this.renderValue()}</div>
          </div>
        </div>
        {editing ? (
          <ButtonToolbar>
            <Button
              bsStyle="success"
              onClick={this.saveSecret}
              disabled={invalid}>
              <Glyphicon glyph="ok" />{' '}
              {isCreating ? 'Create Secret' : 'Save Changes'}
            </Button>
            &nbsp;&nbsp;
            {!isCreating && (
              <ModalItem
                button={true}
                bsStyle="danger"
                onSubmit={this.deleteSecret}
                onComplete={this.props.reloadSecrets}
                body={
                  <span>
                    Are you sure you want to delete secret{' '}
                    <code>{secretId}</code>?
                  </span>
                }>
                <Icon name="trash" /> Delete Secret
              </ModalItem>
            )}
          </ButtonToolbar>
        ) : (
          <ButtonToolbar>
            <Button onClick={this.props.reloadSecrets}>
              <Glyphicon glyph="chevron-left" /> Back to List
            </Button>
            <Button bsStyle="success" onClick={this.startEditing}>
              <Glyphicon glyph="pencil" /> Edit Secret
            </Button>
          </ButtonToolbar>
        )}
      </div>
    );
  }
}
