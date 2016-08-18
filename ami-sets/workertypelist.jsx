var React = require('react');
var bs = require('react-bootstrap');
var utils = require('../lib/utils');
var taskcluster = require('taskcluster-client');
var _ = require('lodash');
var format = require('../lib/format');
var Select = require('react-select');
var ConfirmAction = require('../lib/ui/confirmaction');

// temporary until we have an updated taskcluster-client with the new methods in it
var reference = require('./temp-aws-prov-reference');

var WorkerTypeList = React.createClass({
    mixins: [
      utils.createTaskClusterMixin({
        clients: {
          awsProvisioner: taskcluster.createClient(reference)
        },
        clientOpts: {
          awsProvisioner: {
            baseUrl: 'http://localhost:5557/v1'
          }
        },
      }),
    utils.createLocationHashMixin({
      keys: ['selected'],
      type: 'string'
    })
  ],

  getDefaultProps() {
    return {
      currentAmiSet: ''
    };
  },

  getInitialState() {
    return {
      // selected workerType identifier (string)
      // or 'create:worker-type' to indicate creation of workerType
      selected: '',
      selectedWorkerTypes: [],
      workerTypeSummaries: [],
      workerTypeSummariesLoaded: false,
      workerTypeSummariesError: undefined,
      invalidAmis: [],
      errorWorkerTypes: [],
      error: null
    };
  },

  handleSelectChange (value) {
		// console.log('You\'ve selected:', value);
		this.setState({ selectedWorkerTypes: value });
	},

  toggleDisabled (e) {
		this.setState({ disabled: e.target.checked });
  },

  load() {
    if (!this.props.currentAmiSet) {
      return {
        workerTypeSummaries: this.awsProvisioner.listWorkerTypeSummaries(),
        invalidAmis: [],
        selectedWorkerTypes: [],
        errorWorkerTypes: [],
        error: null
      };
    } else {
      return {
        workerTypeSummaries: this.awsProvisioner.listWorkerTypeSummaries(),
        invalidAmis: this.awsProvisioner.validateAmiSet(this.props.currentAmiSet),
        selectedWorkerTypes: [],
        errorWorkerTypes: [],
        error: null
      };
    }
  },

  setSelected(workerType) {
    this.setState({selected: workerType});
  },

  render() {
    if (this.state.error) {
      return (
        <bs.Alert bsStyle="danger" onDismiss={this.dismissError}>
          <strong>Error executing operation</strong>
          <p>
            {this.state.error.toString()}
          </p>
          {
            this.state.errorWorkerTypes.length &&
            (
              <span>
                <p>The AMI set was not applied to the following Worker Types:</p>
                <ul>
                {
                  this.state.errorWorkerTypes.map(wtype => {
                    return (
                      <li key={wtype.workertype}><strong>{wtype.workertype}</strong></li>
                    )
                  })
                }
                </ul>
              </span>
            )
          }
        </bs.Alert>
      )
    }

    return (
      this.props.currentAmiSet ? (
        this.renderWaitFor('workerTypeSummaries') || this.renderWorkerTypeTable()
      ) : (
        <span>Please, first select an AmiSet.</span>
      )
    )
  },

  renderWorkerTypeTable() {
    let workerTypes = [];
    this.state.workerTypeSummaries.map(workerType => {
      workerTypes.push({ value: workerType.workerType , label: workerType.workerType });
    });

    return (
      <span>
        <h4>
          Select the worker types to apply <code>{ this.props.currentAmiSet }</code>
        </h4>
        <div>
          <Select
            name="form-field-name"
            disabled={this.state.disabled}
            value={this.state.selectedWorkerTypes}
            multi={true}
            options={workerTypes}
            onChange={this.handleSelectChange}
            placeholder="Select workerTypes"
            />
            <br/>
            {this.renderApplyToolbar()}
        </div>
      </span>
    );
  },

  renderApplyToolbar() {
    return (
      <bs.ButtonToolbar>
        <ConfirmAction
          buttonStyle="success"
          glyph="ok"
          label="Apply AMI Sets"
          action={this.applyAmiSet}
          disabled={this.state.invalidAmis.length > 0 ||
                    this.state.selectedWorkerTypes.length == 0}
          success="AMI Set applied">
          Apply <code>{this.props.currentAmiSet}</code>
          to selected Worker Types?
        </ConfirmAction>
      </bs.ButtonToolbar>
    );
  },

  async applyAmiSet() {
    // Validate amiSet again
    let invalidAmis = await this.awsProvisioner.validateAmiSet(this.props.currentAmiSet);
    this.state.errorWorkerTypes = [];

    if (invalidAmis.length > 0){
      this.setState({ error: 'This AMI set contains invalid AMIs.' });
    } else {
      var amiSet = await this.awsProvisioner.amiSet(this.props.currentAmiSet);
      var regions = [];

// instead you should search through the list of regions that already exist in the workerType
// and set rgn.launchSpec.ImageId based on rgn.region and on the instanceType (to determine hvm or pv)
// then if there *is* any data in the secrets or scopes or whatever, it won't be changed

      amiSet.amis.map(ami =>{
        regions.push({
          region: ami.region,
          secrets: {},
          scopes: [],
          userData: {},
          launchSpec:
          {
            ImageId: ami.hvm
          }
        });
      });
      this.state.selectedWorkerTypes.map(async(workerType) => {
        var wtype = await this.awsProvisioner.workerType(workerType.value);

        // Delete Worker Type name and lastModified fields to make sure it passes
        // the schema validation
        delete wtype.workerType;
        delete wtype.lastModified;
        wtype.regions = regions;
        try {
          await this.awsProvisioner.updateWorkerType(workerType.value, wtype);
          this.setState({
            error: null
          });
        } catch(err) {
          this.state.errorWorkerTypes.push({workertype: workerType.value});
          this.setState({ error: err});
        }
      });
    };
  },
});

// Export WorkerTypeTable
module.exports = WorkerTypeList;
