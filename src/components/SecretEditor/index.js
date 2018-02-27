import React from 'react';
import { func, object } from 'prop-types';
import { safeLoad, safeDump } from 'js-yaml';
import { Alert, Button, ButtonToolbar, Glyphicon } from 'react-bootstrap';
import { fromNow } from 'taskcluster-client-web';
import Icon from 'react-fontawesome';
import Spinner from '../Spinner';
import Error from '../Error';
import TimeInput from '../TimeInput';
import DateView from '../DateView';
import CodeEditor from '../CodeEditor';
import ModalItem from '../ModalItem';
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
  renderError() {
    const { error } = this.state;

    if (!error) {
      return null;
    }

    if (loading) {
      return <Spinner />;
    }
    return (
      <Alert bsStyle="danger" onDismiss={this.dismissError}>
        <strong>Error executing operation</strong>
        <br />
        {error.toString()}
      </Alert>
    );
  }

    const isCreating = editing && !secretId;
  renderCreate() {
    const { expires, invalid, secretNameValue } = this.state;

    return (
      <div className="form-group">
        <label className="control-label col-md-2">Secret Name</label>
        <div className="col-md-10">
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
        <div className="form-horizontal">
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
            <div className="alert alert-warning">
              Secrets starting with <code>garbage/</code> are visible to just
              about everybody. Use them to experiment, but not for real secrets!
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-2">Expires</label>
            <div className="col-md-10">
                <DateView date={expires} />
              )}
            <TimeInput
              value={new Date(expires)}
              onChange={this.onExpiresChange}
              className="form-control"
            />
            <br />
            <div className="form-group">
              <label className="control-label col-md-2">
                Secret Value (YAML)
              </label>
              <div className="col-md-10">{this.renderValue()}</div>
            </div>
            <ButtonToolbar>
              <Button
                bsStyle="success"
                onClick={this.saveSecret}
                disabled={invalid}>
                <Glyphicon glyph="ok" />
                {' Create Secret'}
              </Button>
            </ButtonToolbar>
          </div>
        </div>
      </div>
    );
  }

          </div>
          <div className="form-group">
            <label className="control-label col-md-2">
              Secret Value (YAML)
            </label>
            <div className="col-md-10">{this.renderValue()}</div>
          </div>
          <ButtonToolbar>
            <Button bsStyle="success" onClick={this.startEditing}>
              <Glyphicon glyph="pencil" /> Edit Secret
            </Button>
          </ButtonToolbar>
        )}
      </div>
    );
  }
}
