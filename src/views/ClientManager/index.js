import React, { Component } from 'react';
import { Row, Col, ButtonToolbar, Button, Glyphicon, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Clients from '../../components/Clients';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import ClientEditor from '../../components/ClientEditor';

class ClientManager extends Component {
  constructor(props) {
    super(props);

    this.state = {
      clients: null,
      clientPrefix: props.credentials ? `${props.credentials.clientId}/` : '',
      error: null
    };
  }

  componentWillMount() {
    this.loadClients();
  }

  // componentWillReceiveProps(nextProps) {
  //   if (nextProps.clientPrefix !== this.props.clientPrefix) {
  //     this.loadClients(nextProps);
  //   }
  // }

  deleteClient = async (clientId) => {
    await this.props.auth.deleteClient(clientId);
    this.props.history.replace('/auth/clients');
  };

  loadClients = async () => {
    const { clientPrefix } = this.state;

    try {
      this.setState({
        clients: await this.props.auth.listClients(clientPrefix ? { prefix: clientPrefix } : null),
        error: null
      });
    } catch (err) {
      this.setState({
        clients: null,
        error: err
      });
    }
  };

  handlePrefixChange = (e) => this.setState({ clientPrefix: e.target.value });

  handleSubmit = (e) => {
    e.preventDefault();
    this.loadClients();
  };

  renderPrefixInput() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div className="form-group form-group-sm">
          <div className="input-group">
            <div className="input-group-addon text-sm"><em>ClientIds beginning with</em></div>
            <input
              type="search"
              className="form-control"
              value={this.state.clientPrefix}
              onChange={this.handlePrefixChange} />
          </div>
        </div>
      </form>
    );
  }

  renderClientsTable() {
    const { clients, error } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (!clients) {
      return <Spinner />;
    }

    return (
      <Table condensed={true} hover={true} className="client-manager-client-table">
        <thead>
          <tr>
            <th>ClientId</th>
          </tr>
        </thead>
        <tbody>
          {this.state.clients.map(this.renderClientRow)}
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

  render() {
    return (
      <Row style={{ marginTop: 10 }}>
        <Col md={5}>
          {this.renderPrefixInput()}
          {this.renderClientsTable()}
          <ButtonToolbar>
            <Button href={`/auth/clients`} bsStyle="primary" disabled={this.props.clientId === ''}>
              <Glyphicon glyph="plus" /> Add Client
            </Button>
            <Button bsStyle="success" onClick={this.loadClients} disabled={!this.state.clients}>
              <Glyphicon glyph="refresh" /> Refresh
            </Button>
          </ButtonToolbar>
        </Col>
        <Col md={7}>
          <ClientEditor
            auth={this.props.auth}
            credentials={this.props.credentials}
            currentClientId={this.props.clientId}
            deleteClient={this.deleteClient}
            reloadClients={this.loadClients} />
        </Col>
      </Row>
    );
  }
}

export default ({ credentials, match, history }) => (
  <Clients credentials={credentials} Auth>
    {({ auth }) => (
      <ClientManager
        auth={auth}
        history={history}
        credentials={credentials}
        clientId={match.params.clientId ? decodeURIComponent(match.params.clientId) : ''} />
    )}
  </Clients>
);
