var React                   = require('react');
var bs                      = require('react-bootstrap');
var utils                   = require('../lib/utils');
var CodeMirror              = require('react-code-mirror');
var ConfirmAction   = require('../lib/ui/confirmaction');
var _                       = require('lodash');
var taskcluster     = require('taskcluster-client');

require('codemirror/mode/javascript/javascript');


var defaultWorkerType = {
  "workerType": "boilerplate",
  "launchSpecification": {
  },
  "minCapacity": 0,
  "maxCapacity": 1,
  "scalingRatio": 0,
  "minPrice": 0,
  "maxPrice": 0.1,
  "canUseOndemand": false,
  "canUseSpot": true,
  "instanceTypes": [
    {
      "instanceType": "c3.small",
      "capacity": 1,
      "utility": 1,
      "overwrites": {
        "UserData": "e30="      
      }
    }
  ],
  "regions": [
    {
      "region": "us-west-2",
      "overwrites": {
        "ImageId": "ami-abcdefg"
      }
    }
  ]
};

var WorkerTypeEdit = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        awsProvisioner: taskcluster.AwsProvisioner,
      },
      clientOpts: {
        awsProvisioner: {
          baseUrl:      'https://taskcluster-aws-provisioner2.herokuapp.com/v1'
        }
      }
    }),
  ],
  getInitialState: function() {
    var worker = this.props.value || defaultWorkerType;
    console.log(worker);

    function decodeUD(str) {
      return JSON.parse(new Buffer(str, 'base64').toString());
    }

    if (worker.launchSpecification.UserData) {
      worker.launchSpecification.UserData = decodeUD(worker.launchSpecification.UserData);
    }
    
    worker.regions.forEach(function(regionObj) {
      if (regionObj.overwrites.UserData) { 
        regionObj.overwrites.UserData = decodeUD(regionObj.overwrites.UserData);
      }
    });

    worker.instanceTypes.forEach(function(typeObj) {
      if (typeObj.overwrites.UserData) {
        typeObj.overwrites.UserData = decodeUD(typeObj.overwrites.UserData);
      }
    });


    return {
      workerType: JSON.stringify(worker, null, 2),
      invalidWorkerType: false,
    };
  },
  getDefaultProps: function() {
    return {
      value: undefined,
    }
  },
  /** Update state if value property is changed */
  componentWillReceiveProps(nextProps) {
    if (this.props.value !== nextProps) {
      var workerType = JSON.stringify(
        nextProps.value || defaultWorkerType,
        null, 2
      );
      this.setState({
        workerType: workerType,
        invalidWorkerType: false
      });
    }
  },
  handleChange: function(e) {
    var invalid = false;
    try {
      var worker = JSON.parse(e.target.value);
      function encodeUD(obj) {
        return new Buffer(JSON.stringify(obj)).toString('base64');
      }

      if (worker.launchSpecification.UserData) {
        worker.launchSpecification.UserData = encodeUD(worker.launchSpecification.UserData);
      }
      
      worker.regions.forEach(function(regionObj) {
        if (regionObj.overwrites.UserData) { 
          regionObj.overwrites.UserData = encodeUD(regionObj.overwrites.UserData);
        }
      });

      worker.instanceTypes.forEach(function(typeObj) {
        if (typeObj.overwrites.UserData) {
          typeObj.overwrites.UserData = encodeUD(typeObj.overwrites.UserData);
        }
      });

    } catch(err) {
      invalid = true;
      console.error(err);
      if (err.stack) console.log(err.stack);
    }
    this.setState({
      workerType: worker,
      invalidWorkerType: invalid,
    });
  },
  saveWorkerType: function() {
    try {
      var worker = this.state.workerType;
      var wName = worker.workerType;
      // Remember that we specify the name of the workerType
      // to create or update as part of the URL path.  We
      // ensure that it isn't in the create/update definition
      // to make sure that the path element and the json
      // property agree in every case
      delete worker.workerType;
      
      var that = this;
      if (this.props.value) {
        return this.awsProvisioner.updateWorkerType(wName, worker);
      } else {
        return this.awsProvisioner.createWorkerType(wName, worker);
      }
    } catch (err) {
      console.error(err);
      if (err.stack) console.log(err.stack);
      return Promise.reject('Worker Type is not valid JSON');
    }
  },
  render: function() {
    return (<span>
    <CodeMirror
      ref="editor"
      lineNumbers={true}
      mode="application/json"
      textAreaClassName={'form-control'}
      textAreaStyle={{minHeight: '20em'}}
      value={this.state.workerType}
      onChange={this.handleChange}
      indentWithTabs={true}
      tabSize={2}
      theme="ambiance"/>
    <br/>
    <ConfirmAction
      buttonSize='xsmall'
      buttonStyle='default'
      glyph='save'
      label={this.props.value ? 'Update' : 'Create'}
      disabled={this.state.invalidWorkerType}
      action={this.saveWorkerType}
      success='Saved Worker Type'>
      Are you sure that you would like to {this.props.value ? 'update' : 'create'}
      this workerType? If there is a minimum number of instances, they will be
      provisioned
    </ConfirmAction>
    </span>);
  },
});

module.exports = WorkerTypeEdit;
