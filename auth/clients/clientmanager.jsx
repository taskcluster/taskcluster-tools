var React           = require('react');
var bs              = require('react-bootstrap');
var ClientEditor    = require('./clienteditor');
var utils           = require('../../lib/utils');
var taskcluster     = require('taskcluster-client');
var format          = require('../../lib/format');
var _               = require('lodash');

/** Create client manager */
var ClientManager = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        auth:       taskcluster.Auth
      }
    }),
    // Serialize state.selectedClientId to location.hash as string
    utils.createLocationHashMixin({
      keys:                   ['selectedClientId'],
      type:                   'string'
    })
  ],

  /** Create an initial state */
  getInitialState() {
    return {
      clientsLoaded:      false,
      clientsError:       undefined,
      clients:            undefined,
      selectedClientId:   ''   // '' means "add new client"
    };
  },

  /** Load state from auth (using TaskClusterMixin) */
  load() {
    // Creates state properties:
    // - clientsLoaded
    // - clientsError
    // - clients
    return {
      clients:    this.auth.listClients()
    };
  },

  /** Render user-interface */
  render() {
    return (
      <bs.Row>
        <bs.Col md={6}>
          {this.renderClientsTable()}
          <bs.ButtonToolbar>
            <bs.Button bsStyle="primary"
                       onClick={this.selectClientId.bind(this, '')}
                       disabled={this.state.selectedClientId === ''}>
              <bs.Glyphicon glyph="plus"/>
              &nbsp;
              Add Client
            </bs.Button>
            <bs.Button bsStyle="success"
                       onClick={this.reload}
                       disabled={!this.state.clientsLoaded}>
              <bs.Glyphicon glyph="refresh"/>
              &nbsp;
              Refresh
            </bs.Button>
          </bs.ButtonToolbar>
        </bs.Col>
        <bs.Col md={6}>
          <ClientEditor currentClientId={this.state.selectedClientId}
                        reloadClientId={this.reloadClientId}/>
        </bs.Col>
      </bs.Row>
    );
  },

  /** Render table of all clients */
  renderClientsTable() {
    return this.renderWaitFor('clients') || (
      <bs.Table condensed hover className="client-manager-client-table">
        <thead>
          <tr>
            <th>ClientId</th>
            <th>Expires</th>
            <th>Last Used</th>
            <th>Last Rotated</th>
          </tr>
        </thead>
        <tbody>
          {this.state.clients.map(this.renderClientRow)}
        </tbody>
      </bs.Table>
    );
  },

  /** Render row with client */
  renderClientRow(client, index) {
    var isSelected = (this.state.selectedClientId === client.clientId);
    return (
      <tr key={index}
          className={isSelected ? 'info' : undefined}
          onClick={this.selectClientId.bind(this, client.clientId)}>
        <td><code>{client.clientId}</code></td>
        <td><format.DateView date={client.expires}/></td>
        <td><format.DateView date={client.lastDateUsed}/></td>
        <td><format.DateView date={client.lastRotated}/></td>
      </tr>
    );
  },

  async reloadClientId(clientId) {
console.log("reload", clientId);
    // Load client ignore errors (assume client doesn't exist)
    let client = await this.auth.client(clientId).catch(() => null);
console.log("reload", client);
    let selectedClientId = this.state.selectedClientId;
    let clients = _.cloneDeep(this.state.clients);
    var index = _.findIndex(clients, c => c.clientId === clientId);
    if (index === -1 && client !== null) {
      clients.push(client);
    } else if (client !== null) {
      clients[index] = client;
    } else {
      clients = clients.filter(c => c.clientId !== clientId);
    }
    if (_.findIndex(clients, c => c.clientId === selectedClientId) === -1) {
      selectedClientId = '';
    }
    clients.sort((a, b) => a.clientId > b.clientId);
    this.setState({clients, selectedClientId});
  },

  selectClientId(clientId) {
    this.setState({selectedClientId: clientId});
  }
});

// Export ClientManager
module.exports = ClientManager;
