import { PureComponent } from 'react';
import { Button, ButtonToolbar, Alert } from 'react-bootstrap';
import Icon from 'react-fontawesome';
import { parse } from 'qs';
import { fromNow } from 'taskcluster-client-web';
import { scopeIntersection } from 'taskcluster-lib-scopes';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import ClientEditor from './ClientEditor';
import { toArray } from '../../utils';
import styles from './styles.module.css';

export default class ClientCreator extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      creating: false,
      loading: false,
      client: null,
      clientPrefix: null,
      query: parse(props.location.search.slice(1)),
      error: null,
      unknownCallbackAcknowledged: false
    };
  }

  async componentWillMount() {
    await this.loadClientPrefix(this.props.userSession);
    this.loadClient(this.props);
  }

  async componentWillReceiveProps(nextProps) {
    await this.loadClientPrefix(nextProps.userSession);
    this.loadClient(nextProps);
  }

  handleResetAccessToken = async () => {
    this.setState({ loading: true }, async () => {
      try {
        const description =
          this.state.query.description ||
          `Client created ${new Date()} for ${this.state.query.callback_url}`;
        const requestedScopes = toArray(this.state.query.scope);
        const currentScopes = (await this.props.auth.currentScopes()).scopes;

        await this.props.auth.updateClient(this.state.client.clientId, {
          description,
          expires: fromNow(this.state.query.expires || '3 days'),
          scopes: scopeIntersection(currentScopes, requestedScopes),
          deleteOnExpiration: true
        });

        const client = await this.props.auth.resetAccessToken(
          this.state.client.clientId
        );

        this.triggerCallback(client.clientId, client.accessToken);
      } catch (error) {
        this.setState({ error, loading: false });
      }
    });
  };

  handleUnknownCallbackAcknowledgement = () => {
    this.setState({ unknownCallbackAcknowledged: true });
  };

  triggerCallback(clientId, accessToken) {
    window.location.replace(
      `${
        this.state.query.callback_url
      }?clientId=${clientId}&accessToken=${accessToken}`
    );
  }

  createClient = client => {
    this.setState({ error: null }, async () => {
      try {
        const newClient = await this.props.auth.createClient(client.clientId, {
          description: client.description,
          expires: client.expires,
          scopes: client.scopes,
          deleteOnExpiration: true
        });

        this.triggerCallback(newClient.clientId, newClient.accessToken);
      } catch (error) {
        this.setState({ error });
      }
    });
  };

  async nextAvailableClientId(clientName, suffix) {
    const clientWithSuffix = suffix ? `${clientName}-${suffix}` : clientName;

    try {
      await this.props.auth.client(clientWithSuffix);

      return this.nextAvailableClientId(clientName, suffix + 1);
    } catch (err) {
      return clientWithSuffix;
    }
  }

  constructClient = async clientName => {
    const description =
      this.state.query.description ||
      `Client created ${new Date()} for ${this.state.query.callback_url}`;
    const clientId = await this.nextAvailableClientId(clientName, 0);
    const scopes = toArray(this.state.query.scope);

    return {
      clientId,
      scopes: scopes || [],
      description,
      expires: fromNow(this.state.query.expires || '3 days')
    };
  };

  handleCreateNewClient = () => {
    this.setState({ loading: true }, async () => {
      const currentScopes = await this.props.auth.currentScopes();
      const client = await this.constructClient(
        `${this.state.clientPrefix}/${this.state.query.name}`
      );

      client.scopes = scopeIntersection(client.scopes, currentScopes.scopes);

      this.setState({ client, creating: true, loading: false });
    });
  };

  async loadClientPrefix(userSession) {
    if (!userSession) {
      return;
    }

    try {
      const { clientId } = await userSession.getCredentials();

      this.setState({ clientPrefix: clientId });
    } catch (error) {
      this.setState({ clientPrefix: '' });
    }
  }

  async loadClient({ userSession, auth }) {
    if (!userSession || !this.state.clientPrefix) {
      return;
    }

    const clientName = `${this.state.clientPrefix}/${this.state.query.name}`;

    try {
      const client = await auth.client(clientName);

      this.setState({ client });
    } catch (error) {
      this.handleCreateNewClient();
    }
  }

  renderClientAlreadyExists = () => (
    <div className={styles.textCenter}>
      <h3>This clientId already exists.</h3>
      <h4>
        You can re-use it by resetting the access token, but that will cause any
        other uses of that clientId (with the old access token) to stop working.
      </h4>
      <h5>What do you want to do?</h5>
      <ButtonToolbar className={styles.flexCenter}>
        <Button bsStyle="primary" onClick={this.handleCreateNewClient}>
          Create a new clientId
        </Button>
        <Button bsStyle="warning" onClick={this.handleResetAccessToken}>
          <Icon name="refresh" /> Reset accessToken
        </Button>
      </ButtonToolbar>
    </div>
  );

  renderRequestLogin = () => (
    <div>
      <Alert bsStyle="warning">Please sign in to continue.</Alert>
    </div>
  );

  renderInvalidQuery = () => (
    <div>
      <Alert bsStyle="danger">
        This tool must be invoked with query parameters{' '}
        <code>callback_url</code> and <code>name</code>.
      </Alert>
    </div>
  );

  renderUnknownCallback = () => (
    <div>
      <Alert bsStyle="danger">
        You are granting access to <code>{this.state.query.callback_url}</code>.
        This tool is typically only used to grant access to{' '}
        <code>http://localhost</code> as part of a
        <code>taskcluster signin</code> operation.
        <br />
        Granting access to another URL might expose your credentials to an
        attacker that controls that URL.
        <br />
        Are you sure you want to proceed?
        <ButtonToolbar className={styles.flexRight}>
          <Button
            bsStyle="danger"
            onClick={this.handleUnknownCallbackAcknowledgement}>
            Proceed
          </Button>
        </ButtonToolbar>
      </Alert>
    </div>
  );

  // Only localhost callback_url's are whitelisted.  This tool is not intended for other uses
  // than setting up credentials via `taskcluster signin`, which uses this URL format.
  isWhitelistedCallback = callbackUrl =>
    /^https?:\/\/localhost(:[0-9]+)?(\/|$)/.test(callbackUrl);

  render() {
    const { query, unknownCallbackAcknowledged } = this.state;

    if (!query.callback_url || !query.name) {
      return this.renderInvalidQuery();
    }

    if (
      !this.isWhitelistedCallback(query.callback_url) &&
      !unknownCallbackAcknowledged
    ) {
      return this.renderUnknownCallback();
    }

    if (this.state.loading) {
      return <Spinner />;
    }

    if (!this.props.userSession) {
      return this.renderRequestLogin();
    }

    return (
      <div>
        {this.state.error && <Error error={this.state.error} />}

        {!this.state.creating &&
          this.state.client &&
          this.renderClientAlreadyExists()}

        {this.state.creating &&
          this.state.client && (
            <ClientEditor
              client={this.state.client}
              createClient={this.createClient}
            />
          )}
      </div>
    );
  }
}
