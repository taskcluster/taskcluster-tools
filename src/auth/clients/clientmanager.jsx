import React, {Component} from 'react';
import {Row, Col, ButtonToolbar, Button, Glyphicon, Table} from 'react-bootstrap';
import path from 'path';
import ClientEditor from './clienteditor';
import {TaskClusterEnhance} from '../../lib/utils';
import * as auth from '../../lib/auth';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import './clientmanager.less';

/** Create client manager */
class ClientManager extends Component {
  constructor(props) {
    super(props);

    const creds = auth.loadCredentials();
    const selectedClientId = this.props.match.params.selectedClientId ?
      decodeURIComponent(this.props.match.params.selectedClientId) :
      '';

    this.state = {
      clientPrefix: creds ? `${creds.clientId}/` : '',
      clientsLoaded: false,
      clientsError: null,
      clients: null,
      selectedClientId, // '' means "add new client"
    };

    this.reloadClientId = this.reloadClientId.bind(this);
    this.renderClientRow = this.renderClientRow.bind(this);
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

  /** Update values for reloadOnProps and reloadOnKeys */
  componentDidUpdate(prevProps, prevState) {
    this.props.taskclusterState(this.state, this.props);
  }

  onTaskClusterUpdate({detail}) {
    if (detail.name !== this.constructor.name) {
      return;
    }

    this.setState(detail.state);
  }

  /** Load state from auth (using TaskClusterMixin) */
  load(data) {
    if (typeof data === 'object' && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    // Creates state properties:
    // - clientsLoaded
    // - clientsError
    // - clients
    const promisedState = {
      clients: this.props.clients.auth.listClients(this.state.clientPrefix ?
        {prefix: this.state.clientPrefix} :
        null
      )
    };

    this.props.loadState(promisedState);
  }

  /** Render user-interface */
  render() {
    return (
      <Row style={{marginTop: 10}}>
        <Col md={5}>
          {this.renderPrefixInput()}
          {this.renderClientsTable()}
          <ButtonToolbar>
            <Button
              bsStyle="primary"
              onClick={() => this.selectClientId('')}
              disabled={this.state.selectedClientId === ''}>
              <Glyphicon glyph="plus" /> Add Client
            </Button>
            <Button bsStyle="success" onClick={this.load} disabled={!this.state.clientsLoaded}>
              <Glyphicon glyph="refresh" /> Refresh
            </Button>
          </ButtonToolbar>
        </Col>
        <Col md={7}>
          <ClientEditor
            currentClientId={this.state.selectedClientId}
            reloadClientId={this.reloadClientId} />
        </Col>
      </Row>
    );
  }

  renderPrefixInput() {
    const setPrefix = e => this.setState({clientPrefix: e.target.value});
    const enterPrefix = e => {
      if (e.keyCode === 13) {
        e.preventDefault();
        setPrefix(e);
      }
    };

    return (
      <div className="form-group form-group-sm">
        <div className="input-group">
          <div className="input-group-addon text-sm"><em>ClientIds beginning with</em></div>
          <input
            type="search"
            className="form-control"
            defaultValue={this.state.clientPrefix}
            onBlur={setPrefix}
            onKeyUp={enterPrefix} />
          <div className="input-group-addon">
            <Glyphicon glyph="search" />
          </div>
        </div>
      </div>
    );
  }

  /** Render table of all clients */
  renderClientsTable() {
    return this.props.renderWaitFor('clients') || (this.state.clients && (
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
      ));
  }

  /** Render row with client */
  renderClientRow(client, index) {
    const isSelected = this.state.selectedClientId === client.clientId;

    return (
      <tr
        key={index}
        className={isSelected ? 'info' : null}
        onClick={() => this.selectClientId(client.clientId)}>
        <td><code>{client.clientId}</code></td>
      </tr>
    );
  }

  async reloadClientId(clientId) {
    // Load client ignore errors (assume client doesn't exist)
    const client = await this.props.clients.auth
      .client(clientId)
      .catch(() => null);
    let selectedClientId = clientId;
    let clients = _.cloneDeep(this.state.clients);
    const index = _.findIndex(clients, c => c.clientId === clientId);

    if (index === -1 && client !== null) {
      clients.push(client);
    } else if (client !== null) {
      clients[index] = client;
    } else {
      clients = clients.filter(c => c.clientId !== clientId);
    }

    clients.sort((a, b) => a.clientId > b.clientId);
    clients = clients.filter(c => c.clientId.startsWith(this.state.clientPrefix));

    if (_.findIndex(clients, c => c.clientId === selectedClientId) === -1) {
      selectedClientId = '';
    }

    this.setState({clients, selectedClientId});
  }

  selectClientId(clientId) {
    this.props.history.push(path.join('/auth/clients', encodeURIComponent(clientId)));
    this.setState({selectedClientId: clientId});
  }
}

const taskclusterOpts = {
  reloadOnKeys: ['clientPrefix'],
  clients: {
    auth: taskcluster.Auth,
  },
  name: ClientManager.name
};

export default TaskClusterEnhance(ClientManager, taskclusterOpts);
