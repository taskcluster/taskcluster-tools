/** @jsx React.DOM */
var React           = require('react');
var bs              = require('react-bootstrap');
var ClientEditor    = require('./clienteditor');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var format          = require('../lib/format');

/** Create client manager */
var ClientManager = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        auth:       taskcluster.Auth
      }
    })
  ],

  /** Create an initial state */
  getInitialState: function() {
    return {
      clientsLoaded:      false,
      clientsError:       undefined,
      clients:            undefined,
      selectedClientId:   undefined   // undefined means "add new client"
    };
  },

  /** Load state from auth (using TaskClusterMixin) */
  load: function(props) {
    // Creates state properties:
    // - clientsLoaded
    // - clientsError
    // - clients
    return {
      clients:    this.auth.listClients()
    };
  },

  /** Render user-interface */
  render: function() {
    return (
      <bs.Row>
        <bs.Col md={6}>
          {this.renderClientsTable()}
          <bs.ButtonToolbar>
            <bs.Button bsStyle="primary"
                       onClick={this.selectClientId.bind(this, undefined)}
                       disabled={this.state.selectedClientId === undefined}>
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
                        refreshClientList={this.reload}/>
        </bs.Col>
      </bs.Row>
    );
  },

  /** Render table of all clients */
  renderClientsTable: function() {
    return this.renderWaitFor('clients') || (
      <bs.Table condensed hover className="client-manager-client-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>ClientId</th>
            <th>Expires</th>
          </tr>
        </thead>
        <tbody>
          {this.state.clients.map(this.renderClientRow)}
        </tbody>
      </bs.Table>
    );
  },

  /** Render row with client */
  renderClientRow: function(client, index) {
    var isSelected = (this.state.selectedClientId === client.clientId);
    return (
      <tr key={index}
          className={isSelected ? 'info' : undefined}
          onClick={this.selectClientId.bind(this, client.clientId)}>
        <td>{client.name}</td>
        <td><code>{client.clientId}</code></td>
        <td><format.DateView date={client.expires}/></td>
      </tr>
    );
  },

  selectClientId: function(clientId) {
    this.setState({selectedClientId: clientId});
  }
});

// Export ClientManager
module.exports = ClientManager;
