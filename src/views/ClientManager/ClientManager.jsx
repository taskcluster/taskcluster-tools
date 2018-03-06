import { Component } from 'react';
import {
  Row,
  Col,
  ButtonToolbar,
  Button,
  Glyphicon,
  Table,
  Checkbox
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import ClientEditor from '../../components/ClientEditor';
import HelmetTitle from '../../components/HelmetTitle';
import UserSession from '../../auth/UserSession';

export default class ClientManager extends Component {
  constructor(props) {
    super(props);

    this.state = {
      clients: null,
      clientPrefixLoaded: false,
      clientPrefix: null,
      sortByLastUsed: false,
      error: null
    };
  }

  componentWillMount() {
    this.handleLoadClients();
  }

  componentWillReceiveProps(nextProps) {
    if (
      UserSession.userChanged(this.props.userSession, nextProps.userSession)
    ) {
      this.setState({ error: null });
    }
  }

  deleteClient = clientId => this.props.auth.deleteClient(clientId);

  async loadClientPrefix() {
    if (this.state.clientPrefixLoaded) {
      return;
    }

    if (!this.props.userSession) {
      this.setState({ clientPrefixLoaded: true, clientPrefix: '' });

      return;
    }

    try {
      const creds = await this.props.userSession.getCredentials();

      this.setState({
        clientPrefixLoaded: true,
        clientPrefix: `${creds.clientId}/`
      });
    } catch (err) {
      // on error, act like when there's no login
      this.setState({ clientPrefixLoaded: true, clientPrefix: '' });
    }
  }

  handleLoadClients = () => {
    this.setState({ clients: null }, async () => {
      try {
        await this.loadClientPrefix();
        const { clientPrefix } = this.state;

        this.setState({
          clients: await this.props.auth.listClients(
            clientPrefix ? { prefix: clientPrefix } : null
          ),
          error: null
        });
      } catch (err) {
        this.setState({
          clients: null,
          error: err
        });
      }
    });
  };

  handleNavigate = clientId => {
    this.handleLoadClients();
    this.props.history.replace(
      `/auth/clients/${clientId ? encodeURIComponent(clientId) : ''}`
    );
  };

  handlePrefixChange = e => this.setState({ clientPrefix: e.target.value });

  handleSubmit = e => {
    e.preventDefault();
    this.handleLoadClients();
  };

  renderPrefixInput() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div className="form-group form-group-sm">
          <div className="input-group">
            <div className="input-group-addon text-sm">
              <em>ClientIds beginning with</em>
            </div>
            <input
              type="search"
              className="form-control"
              value={this.state.clientPrefix}
              onChange={this.handlePrefixChange}
            />
          </div>
        </div>
      </form>
    );
  }

  renderClientsTable() {
    const { clients, clientPrefixLoaded, error } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (!clientPrefixLoaded || !clients) {
      return <Spinner />;
    }

    return (
      <Table condensed hover className="client-manager-client-table">
        <thead>
          <tr>
            <th>ClientId</th>
          </tr>
        </thead>
        <tbody>
          {clients.sort(this.sortClients).map(this.renderClientRow)}
        </tbody>
      </Table>
    );
  }

  renderClientRow = (client, index) => {
    const isSelected = this.props.clientId === client.clientId;

    return (
      <tr key={`client-row-${index}`} className={isSelected ? 'info' : null}>
        <td>
          <Link to={`/auth/clients/${encodeURIComponent(client.clientId)}`}>
            <code>{client.clientId}</code>
          </Link>
        </td>
      </tr>
    );
  };

  handleSortChange = ({ target }) => {
    this.setState({ sortByLastUsed: target.checked });
  };

  sortByLastUsed(clientA, clientB) {
    const clientALastUsed = new Date(clientA.lastDateUsed);
    const clientBLastUsed = new Date(clientB.lastDateUsed);

    if (clientALastUsed > clientBLastUsed) {
      return -1;
    }

    if (clientALastUsed < clientBLastUsed) {
      return 1;
    }

    return 0;
  }

  sortClients = (clientA, clientB) =>
    this.state.sortByLastUsed
      ? this.sortByLastUsed(clientA, clientB)
      : clientA.clientId.localeCompare(clientB.clientId);

  render() {
    const {
      clients,
      clientPrefixLoaded,
      clientPrefix,
      sortByLastUsed
    } = this.state;

    if (!clientPrefixLoaded) {
      return <Spinner />;
    }

    return (
      <Row style={{ marginTop: 10 }}>
        <HelmetTitle title="Client Manager" />
        <Col md={5}>
          {this.renderPrefixInput()}
          <Checkbox
            defaultChecked={sortByLastUsed}
            onChange={this.handleSortChange}>
            Sort by last used
          </Checkbox>
          {this.renderClientsTable()}
          <ButtonToolbar>
            <Button
              href="/auth/clients"
              bsStyle="primary"
              disabled={this.props.clientId === ''}>
              <Glyphicon glyph="plus" /> Add Client
            </Button>
            <Button
              bsStyle="success"
              onClick={this.handleLoadClients}
              disabled={!clients}>
              <Glyphicon glyph="refresh" /> Refresh
            </Button>
          </ButtonToolbar>
        </Col>
        <Col md={7}>
          {clientPrefixLoaded ? (
            <ClientEditor
              auth={this.props.auth}
              clientPrefix={clientPrefix}
              currentClientId={this.props.clientId}
              deleteClient={this.deleteClient}
              onNavigate={this.handleNavigate}
            />
          ) : (
            <Spinner />
          )}
        </Col>
      </Row>
    );
  }
}
