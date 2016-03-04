var React           = require('react');
var bs              = require('react-bootstrap');
var ClientEditor    = require('./clienteditor');
var utils           = require('../../lib/utils');
var auth            = require('../../lib/auth');
var taskcluster     = require('taskcluster-client');
var format          = require('../../lib/format');
var _               = require('lodash');

/** Create client manager */
var ClientManager = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      reloadOnKeys: ['clientPrefix'],
      clients: {
        auth:                 taskcluster.Auth,
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
    let creds = auth.loadCredentials();
    return {
      clientPrefix:       creds? creds.clientId + "/" : "",
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
      clients:    this.auth.listClients(
                      this.state.clientPrefix? {prefix: this.state.clientPrefix} : undefined)
    };
  },

  /** Render user-interface */
  render() {
    return (
      <bs.Row>
        <bs.Col md={5}>
          {this.renderPrefixInput()}
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
        <bs.Col md={7}>
          <ClientEditor currentClientId={this.state.selectedClientId}
                        reloadClientId={this.reloadClientId}/>
        </bs.Col>
      </bs.Row>
    );
  },

  renderPrefixInput() {
    let setPrefix = (e) => this.setState({clientPrefix: e.target.value});
    let enterPrefix = (e) => {
      if (e.keyCode === 13) {
        e.preventDefault();
        setPrefix(e);
      }
    };
    return <div className="form-group form-group-sm">
       <div className="input-group">
         <div className="input-group-addon text-sm"><em>ClientIds beginning with</em></div>
         <input type="search" className="form-control"
                defaultValue={this.state.clientPrefix}
                onBlur={setPrefix}
                onKeyUp={enterPrefix}/>
         <div className="input-group-addon">
           <bs.Glyphicon glyph="search"/>
         </div>
       </div>
     </div>;
  },

  /** Render table of all clients */
  renderClientsTable() {
    return this.renderWaitFor('clients') || (
      <bs.Table condensed hover className="client-manager-client-table">
        <thead>
          <tr>
            <th>ClientId</th>
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
      </tr>
    );
  },

  async reloadClientId(clientId) {
    // Load client ignore errors (assume client doesn't exist)
    let client = await this.auth.client(clientId).catch(() => null);
    let selectedClientId = clientId;
    let clients = _.cloneDeep(this.state.clients);
    var index = _.findIndex(clients, c => c.clientId === clientId);
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
    this.setState({selectedClientId: clientId});
  }
});

// Export ClientManager
module.exports = ClientManager;
