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
    let invalidAmis = await this.awsProvisioner.validateAmiSet(this.props.currentAmiSet);
    this.state.errorWorkerTypes = [];

    if (!invalidAmis.valid) {
      this.setState({ error: 'This AMI set contains invalid AMIs.' });
    } else {
      var amiSet = await this.awsProvisioner.amiSet(this.props.currentAmiSet);

      this.state.selectedWorkerTypes.map(async(workerType) => {
        var wtype = await this.awsProvisioner.workerType(workerType.value);

        var matched_regions = false;
        amiSet.amis.forEach(ami => {
          wtype.regions.forEach(region => {
            if (ami.region === region.region){
              matched_regions = true;
              region.launchSpec.ImageId = ami.hvm;
            }
          });
        });

        if (matched_regions){
          try {
            let re = /Updated with AMI set*/;
            var today = new Date().toJSON().slice(0,10);
            let updatedDescription = "Updated with AMI set " + this.props.currentAmiSet + " on " + today;

            if (wtype.description.search(re) !== -1) {
              wtype.description = wtype.description.replace(re, updatedDescription);
            } else {
              wtype.description = wtype.description.concat(" - ", updatedDescription);
            }

            // Delete Worker Type name and lastModified fields to make sure it passes
            // the schema validation
            delete wtype.workerType;
            delete wtype.lastModified;

            await this.awsProvisioner.updateWorkerType(workerType.value, wtype);
            this.setState({
              error: null
            });
          } catch(err) {
            this.state.errorWorkerTypes.push({ workertype: workerType.value });
            this.setState({ error: err});
          }
        }
      });
    };
  },
});

// Export WorkerTypeTable
module.exports = WorkerTypeList;
