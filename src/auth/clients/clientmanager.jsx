import React from 'react';
import {Row, Col, ButtonToolbar, Button, Glyphicon, Table} from 'react-bootstrap';
import path from 'path';
import ClientEditor from './clienteditor';
import * as utils from '../../lib/utils';
import * as auth from '../../lib/auth';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import './clientmanager.less';

/** Create client manager */
export default React.createClass({
  displayName: 'ClientManager',

  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      reloadOnKeys: ['clientPrefix'],
      clients: {
        auth: taskcluster.Auth,
      },
    })
  ],

  /** Create an initial state */
  getInitialState() {
    const creds = auth.loadCredentials();
    const selectedClientId = this.props.location.pathname
      .split(path.join(this.props.match.url, '/'))
      .filter(path => path.length)
      .join();

    return {
      clientPrefix: creds ? `${creds.clientId}/` : '',
      clientsLoaded: false,
      clientsError: null,
      clients: null,
      selectedClientId, // '' means "add new client"
    };
  },

  /** Load state from auth (using TaskClusterMixin) */
  load() {
    // Creates state properties:
    // - clientsLoaded
    // - clientsError
    // - clients
    return {
      clients: this.auth.listClients(this.state.clientPrefix ?
        {prefix: this.state.clientPrefix} :
        null
      ),
    };
  },

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
            <Button bsStyle="success" onClick={this.reload} disabled={!this.state.clientsLoaded}>
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
  },

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
  },

  /** Render table of all clients */
  renderClientsTable() {
    return this.renderWaitFor('clients') || (
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
  },

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
  },

  async reloadClientId(clientId) {
    // Load client ignore errors (assume client doesn't exist)
    const client = await this.auth
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
  },

  selectClientId(clientId) {
    console.log('hello : ', clientId);
    this.props.history.push(path.join('/', this.props.match.url, clientId));
    this.setState({selectedClientId: clientId});
  },
});
