var React = require('react');
var bs = require('react-bootstrap');
var AmiSetEditor = require('./amiseteditor');
var utils = require('../lib/utils');
var taskcluster = require('taskcluster-client');

// temporary until we have an updated taskcluster-client with the new methods in it
var reference = require('./temp-aws-prov-reference');

var AmiSetManager = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        awsProvisioner: taskcluster.createClient(reference)
      },
      clientOpts: {
        awsProvisioner: {
          baseUrl: 'https://aws-provisioner.taskcluster.net/v1'
        }
      },
    }),
    // Serialize state.selectedAmiSet to location.hash as string
    utils.createLocationHashMixin({
      keys: ['selectedAmiSet'],
      type: 'string'
    })
  ],

  getInitialState() {
    return {
      amiSetsLoaded: false,
      amiSetsError: null,
      amiSets: null,
      selectedAmiSet: '' // '' means "add new ami-set"
    };
  },

  /** Load state from amiSet (using TaskClusterMixin) */
  load() {
    return {
      amiSets: this.awsProvisioner.listAmiSets()
    };
  },

  render() {
    return (
      <bs.Row>
        <bs.Col md={5}>
          {this.renderAmiSetsTable()}
          <bs.ButtonToolbar>
            <bs.Button
              bsStyle="primary"
              onClick={this.selectAmiSet.bind(this, '')}
              disabled={this.state.selectedAmiSet === ''}>
              <bs.Glyphicon glyph="plus"/> Add AMI Set
            </bs.Button>
            <bs.Button
              bsStyle="success"
              onClick={this.reload}
              disabled={!this.state.amiSetsLoaded}>
              <bs.Glyphicon glyph="refresh"/> Refresh
            </bs.Button>
          </bs.ButtonToolbar>
        </bs.Col>
        <bs.Col md={7}>
          <AmiSetEditor
            currentAmiSet={this.state.selectedAmiSet}
            reloadAmiSet={this.reloadAmiSet}
            refreshAmiSetsList={this.refreshAmiSetsList}
            selectAmiSet={this.selectAmiSet} />
        </bs.Col>
      </bs.Row>
    );
  },

  renderAmiSetsTable() {
    return this.renderWaitFor('amiSets') || (
      <bs.Table ref="amisetstable" condensed hover className="ami-set-manager-table">
        <thead>
          <tr>
            <th>AmiSet</th>
          </tr>
        </thead>
        <tbody>
          {this.state.amiSets.map(this.renderAmiSetRow)}
        </tbody>
      </bs.Table>
    );
  },

  renderAmiSetRow(amiSet, index) {
    var isSelected = this.state.selectedAmiSet === amiSet;

    return (
      <tr key={index}
        className={isSelected ? 'info' : ''}
        onClick={this.selectAmiSet.bind(this, amiSet)}>
        <td><code>{amiSet}</code></td>
      </tr>
    );
  },

  async reloadAmiSet(amiSetId) {
    // Load amiSet ignore errors (assume amiSet doesn't exist)
    let amiSet = await this.awsProvisioner.amiSet(amiSetId).catch(() => null);
    let selectedAmiSet = amiSetId;
    let amiSets = _.cloneDeep(this.state.amiSets);
    var index = _.findIndex(amiSets, a => a.amiSet === amiSetId);

    if (index === -1 && amiSet !== null) {
      amiSets.push(amiSet);
    } else if (amiSet !== null) {
      amiSets[index] = amiSet;
    } else {
      amiSets = amiSets.filter(aSet => aSet.amiSet !== amiSetId);
    }

    if (_.findIndex(amiSets, aSet => aSet.amiSet === selectedAmiSet) === -1) {
      selectedAmiSet = '';
    }

    amiSets.sort((a, b) => a.amiSet > b.amiSet);
    this.setState({ amiSets, selectedAmiSet });
  },

  refreshAmiSetsList() {
    this.reload();
  },

  selectAmiSet(amiSet) {
    this.setState({ selectedAmiSet: amiSet });
  }
});

module.exports = AmiSetManager;
