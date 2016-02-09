var React            = require('react');
var bs               = require('react-bootstrap');
var utils            = require('../lib/utils');
var taskcluster      = require('taskcluster-client');
var SecretEditor     = require('./secreteditor');

var SecretsManager = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        secrets:       taskcluster.Secrets
      }
    }),
    utils.createLocationHashMixin({
      keys:                   ['selectedSecretId'],
      type:                   'string'
    })
  ],

  /** Create an initial state */
  getInitialState() {
    return {
      selectedSecretId: '',
      secrets: undefined,
      secretsLoaded: false,
      secretsError: null,
    };
  },

  load() {
    return {
      secrets: this.secrets.list().then((resp) => resp.secrets)
    };
  },

  /** Render the main layout of the secrets manager page */
  render() {
    try {
      return (
        <bs.Row>
          <bs.Col md={5}>
            {this.renderSecretsTable()}
            <bs.ButtonToolbar>
              <bs.Button bsStyle="primary"
                         onClick={this.selectSecretId.bind(this, '')}
                         disabled={this.state.selectedSecretId === ''}>
                <bs.Glyphicon glyph="plus"/>
                &nbsp;
                Add Secret
              </bs.Button>
              <bs.Button bsStyle="success"
                         onClick={this.reload}
                         disabled={!this.state.secretsLoaded}>
                <bs.Glyphicon glyph="refresh"/>
                &nbsp;
                Refresh
              </bs.Button>
            </bs.ButtonToolbar>
          </bs.Col>
          <bs.Col md={7}>
            <SecretEditor currentSecretId={this.state.selectedSecretId}
                          reloadSecrets={this.reloadSecrets} />
          </bs.Col>
        </bs.Row>
      );
    } catch(e) {
      console.log(e);
    }
  },

  renderSecretsTable() {
    return this.renderWaitFor('secrets') || (
      <bs.Table condensed hover>
        <thead>
          <tr>
            <th>SecretId</th>
          </tr>
        </thead>
        <tbody>
             {this.state.secrets.map(this.renderSecretRow)}
        </tbody>
      </bs.Table>
    );
  },

  renderSecretRow(secretId, index) {
    var isSelected = (this.state.selectedSecretId === secretId);
    return (
      <tr key={index}
          className={isSelected ? 'info' : undefined}
          onClick={this.selectSecretId.bind(this, secretId)}>
        <td><code>{secretId}</code></td>
      </tr>
    );
  },

  selectSecretId(secretId) {
    this.setState({selectedSecretId: secretId});
  },

  reloadSecrets() {
    this.setState({selectedSecretId: ''});
    this.reload();
  },
})


// Export SecretsManager
module.exports = SecretsManager;
