import React from 'react';
import { Button, ButtonToolbar, Glyphicon } from 'react-bootstrap';
import { parse } from 'qs';
import { fromNow } from 'taskcluster-client-web';
import DateView from '../../components/DateView';
import Error from '../../components/Error';
import CredentialsMenu from '../../components/CredentialsMenu';
import ClientEditor from './ClientEditor';
import styles from './styles.css';

export default class AuthNew extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      creating: false,
      isNewClient: false,
      client: null,
      error: null
    };
  }

  componentWillMount() {
    this.load(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.load(nextProps);
  }

  handleResetAccessToken = () => {
    const { credentials } = this.props.userSession;

    this.triggerCallback(this.state.client.clientId, credentials.accessToken);
  };

  triggerCallback = (clientId, accessToken) => {
    const callbackUrl = parse(this.props.location.search.slice(1)).callback_url;

    window.location.replace(
      `${callbackUrl}?clientId=${clientId}&accessToken=${accessToken}`
    );
  };

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

  handleCreateNewClient = () => this.setState({ creating: true });

  constructClient = previousClient => {
    const nextClient = parse(this.props.location.search.slice(1));
    const description =
      nextClient.description ||
      `Client created ${new Date()} for ${nextClient.callback_url}`;

    return {
      ...previousClient,
      ...{
        clientId: `${this.props.userSession.credentials
          .clientId}/${nextClient.name}`,
        scopes: nextClient.scope || [],
        description,
        expires: fromNow(nextClient.expires || '3 days')
      }
    };
  };

  load = async ({ userSession, location, auth }) => {
    if (!userSession) {
      return;
    }

    const { name } = parse(location.search.slice(1));
    const id = `${userSession.credentials.clientId}/${name}`;

    try {
      const previousClient = (await auth.listClients({
        prefix: id
      })).filter(({ clientId }) => clientId === id)[0];
      const client = this.constructClient(previousClient);

      if (!previousClient) {
        return this.setState({ client, creating: true, isNewClient: true });
      }

      return this.setState({ client, isNewClient: false });
    } catch (error) {
      this.setState({ error });
    }
  };

  renderUserOption = () => (
    <div className={styles.textCenter}>
      <h4>
        The accessToken is expiring{' '}
        <strong>{<DateView date={this.state.client.expires} />}</strong>. What
        do you want to do?
      </h4>
      <ButtonToolbar className={styles.flexCenter}>
        <Button bsStyle="primary" onClick={this.handleCreateNewClient}>
          Create a new clientId
        </Button>
        <Button bsStyle="warning" onClick={this.handleResetAccessToken}>
          <Glyphicon glyph="fire" /> Reset accessToken
        </Button>
      </ButtonToolbar>
    </div>
  );

  requestLogin = () => (
    <div>
      <h4>Sign in</h4>
      <div className={styles.authItems}>
        <CredentialsMenu
          authController={this.props.authController}
          inline={true}
        />
      </div>
    </div>
  );

  render() {
    if (!this.props.userSession) {
      return this.requestLogin();
    }

    return (
      <div>
        {this.state.error && <Error error={this.state.error} />}
        {!this.state.creating && this.state.client && this.renderUserOption()}
        {this.state.creating &&
          this.state.client && (
            <ClientEditor
              isNewClient={this.state.isNewClient}
              client={this.state.client}
              createClient={this.createClient}
              userSession={this.props.userSession}
              resetAccessToken={this.resetAccessToken}
            />
          )}
      </div>
    );
  }
}
