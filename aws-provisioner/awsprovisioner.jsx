'use strict';
/** @jsx React.DOM */
var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var _               = require('lodash');
var format          = require('../lib/format');
var ConfirmAction   = require('../lib/ui/confirmaction');
var WorkerTypeEdit  = require('./workertypeedit');

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
  } catch(e) {
    console.log(e, e.stack);
    alert('Uh-oh, error: ' + e);
  }
} else {
  alert('Uh-oh, failed to load API reference');
}
if (reference.baseUrl[4] !== 's') {
  reference.baseUrl = 'https://' + reference.baseUrl.slice(7);
}
var AwsProvisionerClient = taskcluster.createClient(reference);
/** END SUPER HACK */

// Questions:
//  1. Should I create a client for each react class or 
//     share the parent classes?

var WorkerTypeTable = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        awsProvisioner: AwsProvisionerClient,
      },
    }),
  ],

  propTypes: {
    selectWorkerType: React.PropTypes.func.isRequired,
  },

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
      //awsState: this.awsProvisioner.updateAwsState(),
      awsState: this.awsProvisioner.awsState(),
    };
  },
  
  render: function() {
    // TODO: Should write a note somewhere explaining what all these terms
    //       mean
    var that = this;
    return this.renderWaitFor('workerTypes') ||
           this.renderWaitFor('awsState') || 
      (<bs.Table striped bordered condensed hover>
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
          
          this.state.workerTypes.map(function(name) {
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
            return <WorkerTypeRow 
                      key={name} 
                      awsState={realState}
                      workerType={name}
                      selectWorkerType={that.props.selectWorkerType}
                      reload={that.reload.bind(that)} />;
          })
        }
        </tbody>
      </bs.Table>
    );
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
      pendingTasks:
        this.queue.pendingTasks(provisionerId, this.props.workerType),
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
            runningCapacity += itd.capacity;
          }
        });
      });

      s.pending.forEach(function(node) {
        w.instanceTypes.forEach(function(itd) {
          if (itd.instanceType === node.InstanceType) {
            pendingCapacity += itd.capacity;
          }
        });
      });

      s.spotReq.forEach(function(node) {
        w.instanceTypes.forEach(function(itd) {
          if (itd.instanceType === node.LaunchSpecification.InstanceType) {
            spotReqCapacity += itd.capacity;
          }
        });
      });
    }

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
      runningBar = <bs.ProgressBar
                      bsStyle='success'
                      now={percentRunning}
                      key={key++}
                      label={runningCapacity} />
    }
    if (pendingCapacity > 0) {
      percentPending = pendingCapacity / maxCapacity * 100;
      if (percentPending > 0 && percentPending < 5) {
        var diff = 5 - percentPending;
        percentPending = 5;
        offset += diff;
      }
      pendingBar = <bs.ProgressBar
                      bsStyle='info'
                      now={percentPending}
                      key={key++}
                      label={pendingCapacity} />
    }
    if (spotReqCapacity > 0) {
      percentRequested = spotReqCapacity / maxCapacity * 100;
      if (percentRequested > 0 && percentRequested < 5) {
        var diff = 5 - percentRequested;
        percentRequested = 5;
        offset += diff;
      }
      requestedBar = <bs.ProgressBar
                        bsStyle='warning'
                        now={percentRequested}
                        key={key++}
                        label={spotReqCapacity} />
    }

    // TODO Figure out a way to show this as a class danger probably
    var excess = (runningCapacity +
                  pendingCapacity +
                  spotReqCapacity) - maxCapacity;

    var progressBar = (<bs.ProgressBar>
        {runningBar ? runningBar : ''}
        {pendingBar ? pendingBar: ''}
        {requestedBar ? requestedBar : ''}
    </bs.ProgressBar>);


    function viewHandler() {
      that.props.selectWorkerType(
          that.props.workerType,
          that.state.workerType,
          that.props.awsState,
          {
            running: runningCapacity,
            pending: pendingCapacity,
            spotReq: spotReqCapacity,
          },
          progressBar);
    }
    
    return this.renderWaitFor('pendingTasks') ||
      this.renderWaitFor('workerType') || (<tr>
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
          <bs.Button
            bsStyle='primary'
            bsSize='xsmall'
            onClick={viewHandler}
          >
          View
          </bs.Button>

          <ConfirmAction 
            buttonSize='xsmall'
            buttonStyle='danger'
            glyph='remove'
            label='Delete'
            disabled={false}
            action={this.removeWorkerType}
            success='Deleted WorkerType'>
              Are you sure that you wish to remove the workerType?
              This will terminate <b>all</b> instances of this worker
              type unconditionally
          </ConfirmAction>
        </bs.ButtonToolbar>
      </td>
    </tr>);  
  },

  removeWorkerType: function() {
    return this.awsProvisioner.removeWorkerType(this.props.workerType).then(function() {
      return this.props.reload();
    });
  },
});


/** 
TODO:
  - List capacity for each instance/sr
  - Display spot bid and 'true price'
*/
var StatsTable = React.createClass({
  render: function() {
    var that = this;
    var header;
    if (this.props.isSpot) {
      header = (<tr>
        <th>Spot Request Id</th>
        <th>Instance Type</th>
        <th>Region</th>
        <th>AZ</th>
        <th>AMI</th>
        <th>Create Time</th>
      </tr>);
    } else {
      header = (<tr>
        <th>Instance Id</th>
        <th>Spot Request Id</th>
        <th>Instance Type</th>
        <th>Region</th>
        <th>AZ</th>
        <th>AMI</th>
        <th>Launch Time</th>
      </tr>);
    }
    return (
        <bs.Table striped bordered condensed hover>
          <thead>
          {header}
          </thead>
          {
            this.props.states.map(function(state) {
              if (that.props.isSpot) {
                return (<tr key={state.SpotInstanceRequestId}>
                  <td><b>{state.SpotInstanceRequestId}</b></td>
                  <td>{state.LaunchSpecification.InstanceType}</td>
                  <td>{state.Region}</td>
                  <td>{state.LaunchSpecification.Placement.AvailabilityZone}</td>
                  <td>{state.LaunchSpecification.ImageId}</td>
                  <td>{state.CreateTime}</td>
                </tr>);
              } else {
                return (<tr key={state.InstanceId}>
                  <td><b>{state.InstanceId}</b></td>
                  <td>{state.SpotInstanceRequestId}</td>
                  <td>{state.InstanceType}</td>
                  <td>{state.Region}</td>
                  <td>{state.Placement.AvailabilityZone}</td>
                  <td>{state.ImageId}</td> 
                  <td>{state.LaunchTime}</td>
                </tr>);
              }
            })
          }
        </bs.Table>
    );
  },
});

var WorkerTypeDetail = React.createClass({
  render: function() {
    return (
        <div>
        <h1>{this.props.name}</h1>

        <h2>Worker Type Definition</h2>
        <WorkerTypeEdit value={this.props.definition} />

        <h2>Capacity Information</h2>
        {this.props.progressBar}

        <h3>Running</h3>
          <p>{this.props.capacityInfo.running} capacity ({this.props.awsState.running.length} instances)</p>
          <StatsTable isSpot={false} states={this.props.awsState.running} />

        <h3>Pending</h3>
          <p>{this.props.capacityInfo.pending} capacity ({this.props.awsState.pending.length} instances)</p>
          <StatsTable isSpot={false} states={this.props.awsState.pending} />

        <h3>Requested</h3>
          <p>{this.props.capacityInfo.spotReq} capacity ({this.props.awsState.spotReq.length} instances)</p>
          <StatsTable isSpot={true} states={this.props.awsState.spotReq} />

        {/*<pre>
        {JSON.stringify(this.props.definition, null, 2)}
        </pre>*/}
        </div>
    );
  },
});

var AwsProvisioner = React.createClass({
  getInitialState: function() {
    return {
      selectedWorkerType: '',
      selectedWorkerTypeDefinition: {},
    };
  },

  selectWorkerType: function(name, definition, awsState, capacityInfo, progressBar) {
    this.setState({
      selectedWorkerTypeName: name,
      selectedWorkerTypeDefinition: definition,
      selectedWorkerTypeAwsState: awsState,
      selectedWorkerTypeCapacityInfo: capacityInfo,
      selectedWorkerTypeProgressBar: progressBar,
    });
  },

  render: function() {
    var workerTypeDetail;
    if (this.state.selectedWorkerTypeName) {
      workerTypeDetail = <WorkerTypeDetail
                            name={this.state.selectedWorkerTypeName}
                            definition={this.state.selectedWorkerTypeDefinition}
                            awsState={this.state.selectedWorkerTypeAwsState}
                            capacityInfo={this.state.selectedWorkerTypeCapacityInfo}
                            progressBar={this.state.selectedWorkerTypeProgressBar}
                         />
    }
    return (
        <div>
        <WorkerTypeTable selectWorkerType={this.selectWorkerType} />
        { workerTypeDetail ? workerTypeDetail : '' }
        </div>
    );
  },

});

// Export IndexBrowser
module.exports = AwsProvisioner;
