/** @jsx React.DOM */
var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var _               = require('lodash');
var format          = require('../lib/format');

// Should this be allowed to be set by user?
var provisionerId = 'aws-provisioner-v1';

/** BEGIN SUPER HACK */
var request = new XMLHttpRequest();
console.log('ignore this deprecation... once the API is in the upstream client we wont need '+
            'to do this anymore');
request.open('GET', 'https://taskcluster-aws-provisioner2.herokuapp.com/v1/api-reference', false);
//request.open('GET', 'http://localhost:5557/v1/api-reference', false);
request.send(null);
if (request.status === 200) {
  var reftxt = request.responseText;
  try {
    var reference = JSON.parse(reftxt);
    console.dir(reference);
  } catch(e) {
    console.log(e, e.stack);
    alert('Uh-oh, error: ' + e);
  }
} else {
  alert('Uh-oh, failed to load API reference');
}
//console.log('HIHIHIHH' + reference.baseUrl);
if (reference.baseUrl[4] !== 's') {
  console.log(reference.baseUrl);
  reference.baseUrl = 'https://' + reference.baseUrl.slice(7);
  console.log(reference.baseUrl);
}
var AwsProvisionerClient = taskcluster.createClient(reference);
/** END SUPER HACK */

// Questions:
//  1. Should I create a client for each react class or share the parent classes?
//  2. Why does the aws-provisioner not allow cross-origin requests?


var WorkerTypeTable = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        awsProvisioner: AwsProvisionerClient,
      }
    }),
  ],

  getInitialState: function() {
    return {
      workerTypes: [],
      workerTypesLoaded: true,
      workerTypesError: undefined,
      awsState: {},
      awsStateLoaded: true,
      awsStateError: undefined,
      current: '',
    };
  },

  load: function() {
    return {
      workerTypes: this.awsProvisioner.listWorkerTypes(),
      awsState: this.awsProvisioner.updateAwsState(),
      //awsState: this.awsProvisioner.awsState(),
    };
  },
  
  render: function() {
    // TODO: Should write a note somewhere explaining what all these terms mean
    var that = this;
    return (
      <bs.Table striped bordered condensed hover>
        <thead>
          <tr>
            <th>Worker Type Name</th>
            <th className='col-md-6'>Capacity</th>
            <th>Pending Tasks</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        {
          this.renderWaitFor('workerTypes') || this.renderWaitFor('awsState') || this.state.workerTypes.map(function(name) {
            var realState;
            if (that.state.awsState[name]) {
              realState = that.state.awsState[name];
            } else {
              realState = {
                running: [],
                pending: [],
                spotReq: [],
              };
            }
            return <WorkerTypeRow key={name} awsState={realState} workerType={name} removeWorkerFromTable={that.removeWorkerFromTable}/>;
          })
        }
        </tbody>
      </bs.Table>
    );
  },
  removeWorkerFromTable: function(name) {
    this.setState({
      workerTypes: this.state.workerTypes.filter(function(x) {
        return x !== name;
      })
    });
  },
});

var WorkerTypeRow = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        queue: taskcluster.Queue,
        awsProvisioner: AwsProvisionerClient,
      },
    }),
  ],

  propTypes: {
    workerType: React.PropTypes.string.isRequired,
    awsState: React.PropTypes.shape({
      running: React.PropTypes.arrayOf(React.PropTypes.object),
      pending: React.PropTypes.arrayOf(React.PropTypes.object),
      spotReq: React.PropTypes.arrayOf(React.PropTypes.object),
    }).isRequired,
  },

  getInitialState: function() {
    return {
      pendingTasks: {},
      pendingTasksLoaded: true,
      pendingTasksError: undefined,
      workerType: undefined,
      workerTypeLoaded: true,
      workerTypeError: undefined,
    };
  },

  load: function() {
    return {
      pendingTasks: this.queue.pendingTasks(provisionerId, this.props.workerType),
      workerType: this.awsProvisioner.workerType(this.props.workerType),
    };
  },

  render: function() {
    var that = this;
    var runningCapacity = 0;
    var pendingCapacity = 0;
    var spotReqCapacity = 0;
    var maxCapacity = 0;

    if (this.state.workerType) {
      var s = this.props.awsState;
      var w = this.state.workerType;
      maxCapacity = w.maxCapacity;
      
      s.running.forEach(function(node) {
        w.instanceTypes.forEach(function(itd) {
          if (itd.instanceType === node.InstanceType) {
            console.log('Adding ' + itd.capacity + ' to running capacity');
            runningCapacity += itd.capacity;
          }
        });
      });

      s.pending.forEach(function(node) {
        w.instanceTypes.forEach(function(itd) {
          if (itd.instanceType === node.InstanceType) {
            console.log('Adding ' + itd.capacity + ' to pending capacity');
            pendingCapacity += itd.capacity;
          }
        });
      });

      s.spotReq.forEach(function(node) {
        w.instanceTypes.forEach(function(itd) {
          if (itd.instanceType === node.LaunchSpecification.InstanceType) {
            console.log('Adding ' + itd.capacity + ' to requested capacity');
            spotReqCapacity += itd.capacity;
          }
        });
      });
    }

    console.log(this.props.workerType + 'running: ' + runningCapacity +
                ' pending: ' + pendingCapacity + ' requested: ' + spotReqCapacity);
    var percentRunning;
    var percentPending;
    var percentRequested;

    var runningBar;
    var pendingBar;
    var requestedBar;
    var excessBar;

    // This is the difference to subtract from the largest... maybe
    var offset = 0;

    var key = 1;
    if (runningCapacity > 0) {
      percentRunning = runningCapacity / maxCapacity * 100;
      if (percentRunning > 0 && percentRunning < 5) {
        var diff = 5 - percentRunning;
        percentRunning = 5;
        offset += diff;
      }
      runningBar = <bs.ProgressBar bsStyle='success' now={percentRunning} key={key++} label={runningCapacity} />
    }
    if (pendingCapacity > 0) {
      percentPending = pendingCapacity / maxCapacity * 100;
      if (percentPending > 0 && percentPending < 5) {
        var diff = 5 - percentPending;
        percentPending = 5;
        offset += diff;
      }
      pendingBar = <bs.ProgressBar bsStyle='info' now={percentPending} key={key++} label={pendingCapacity} />
    }
    if (spotReqCapacity > 0) {
      percentRequested = spotReqCapacity / maxCapacity * 100;
      if (percentRequested > 0 && percentRequested < 5) {
        var diff = 5 - percentRequested;
        percentRequested = 5;
        offset += diff;
      }
      requestedBar = <bs.ProgressBar bsStyle='warning' now={percentRequested} key={key++} label={spotReqCapacity} />
    }

    // TODO Figure out a way to show this as a class danger probably
    var excess = (runningCapacity + pendingCapacity + spotReqCapacity) - maxCapacity;
    console.log(excess);

    var progressBar = (<bs.ProgressBar>
        {runningBar ? runningBar : ''}
        {pendingBar ? pendingBar: ''}
        {requestedBar ? requestedBar : ''}
    </bs.ProgressBar>);

    
    return this.renderWaitFor('pendingTasks') || this.renderWaitFor('workerType') || (<tr>
      <td>{this.props.workerType}</td>
      {/*<td>{runningCapacity} ({this.props.awsState.running.length})</td>
      <td>{pendingCapacity} ({this.props.awsState.pending.length})</td>
      <td>{spotReqCapacity} ({this.props.awsState.spotReq.length})</td>*/}
      <td>
        {progressBar}
      </td>
      <td>{this.state.pendingTasks.pendingTasks}</td>
      <td>
        <bs.ButtonToolbar>
        <bs.ModalTrigger 
            modal={<WorkerTypeDetail 
                      name={this.props.workerType} 
                      worker={this.state.workerType}
                      awsState={this.props.awsState}
                      runningCapacity={runningCapacity}
                      pendingCapacity={pendingCapacity}
                      spotReqCapacity={spotReqCapacity}
                      progressBar={progressBar}
            />}>
          <bs.Button bsStyle='primary' bsSize='xsmall'>View</bs.Button>
        </bs.ModalTrigger>
        <bs.Button bsStyle='danger' bsSize='xsmall' onClick={this.removeWorkerType}>Remove</bs.Button>
        {/* Hmm, should I allow deleting from here or should that only be under details...*/}
        {/*<bs.Button bsStyle='danger' bsSize='xsmall' onClick={this.handleDelete}>Delete</bs.Button>*/}
        </bs.ButtonToolbar>
      </td>
    </tr>);  
  },

  removeWorkerType: function() {
    var that = this;
    console.log('Deleting %s', this.props.workerType);
    var p = this.awsProvisioner.removeWorkerType(this.props.workerType);

    p.then(function() {
      console.log('Deleted ' + that.props.workerType);
      that.props.removeWorkerFromTable(that.props.workerType);
    });

    p.catch(function(err) {
      console.error(err);
      if (err.stack) console.log(err.stack);
      if (err.statusCode === 404) {
        console.log('Tried to delete ' + that.props.workerType + ' but it does not exist.');
        console.log('Maybe you already clicked this button!');
      } else {
        alert('Failed to delete ' + that.props.workerType);
      }
    });

    p.done();
  },
});

var WorkerTypeDetail = React.createClass({
  renderNodeTable: function(stateInfo, isSpot) {
    // StateInfo is one of the state lists, e.g. running,pending
    stateInfo.forEach(function(node) {
      var instanceType;
      var region;
      var az;

      if (isSpot) {
        
      } else {

      }
    });
  },
  render: function() {
    return (
      <bs.Modal {...this.props} bsStyle='primary' title={this.props.name + " details"}>
        <div className='modal-body'>
        {this.props.progressBar}
        Detailed Capacity Information:
        <ul>
          <li>Running: {this.props.runningCapacity} capacity units, {this.props.awsState.running.length} instances</li>
          <li>Pending: {this.props.pendingCapacity} capacity units, {this.props.awsState.pending.length} instances</li>
          <li>Requested: {this.props.spotReqCapacity} capacity units, {this.props.awsState.spotReq.length} instances</li>
        </ul>
        <pre>{JSON.stringify(this.props.worker, undefined, 2)}</pre>
        </div>
        <div className='modal-footer'>
          <bs.Button onClick={this.props.onRequestHide}>Close</bs.Button>
        </div>
      </bs.Modal>
    );
  },
});

var AwsProvisioner = React.createClass({
  mixins: [
    // Calls load()
    utils.createTaskClusterMixin({
      clients: {
        awsProvisioner: taskcluster.Index
      },
    }),
  ],

  propTypes: {
  },

  getInitialState: function() {
    return {
      workerType: "",
    };
  },

  load: function() {
    return {
    };
  },

  render: function() {
    return (
        <WorkerTypeTable />
    );
  },

});

// Export IndexBrowser
module.exports = AwsProvisioner;
