var React             = require('react');
var bs                = require('react-bootstrap');
var utils             = require('../lib/utils');
var taskcluster       = require('taskcluster-client');
var _                 = require('lodash');
var format            = require('../lib/format');
var ConfirmAction     = require('../lib/ui/confirmaction');
var WorkerTypeEdit    = require('./workertypeedit');
var WorkerTypeDetail  = require('./workerdetail');

const PROVISIONER_ID = 'aws-provisioner-v1';

var WorkerTypeTable = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        awsProvisioner: taskcluster.AwsProvisioner,
      },
      clientOpts: {
        awsProvisioner: {
          baseUrl: 'https://taskcluster-aws-provisioner2.herokuapp.com/v1'
        }
      }
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
      awsState: this.awsProvisioner.awsState(),
    };
  },
  
  render: function() {
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
                      reload={that.reload} />;
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
        awsProvisioner: taskcluster.AwsProvisioner
      },
      clientOpts: {
        awsProvisioner: {
          baseUrl: 'https://taskcluster-aws-provisioner2.herokuapp.com/v1'
        }
      }
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
        this.queue.pendingTasks(PROVISIONER_ID, this.props.workerType),
      workerType: this.awsProvisioner.workerType(this.props.workerType),
    };
  },

  render: function() {
    var that = this;

    // We need to count the capacity.  This is a reimplementation
    // of the logic in the provisioner proper to avoid needing
    // to import all of that stuff.
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
    var that = this;
    return this.awsProvisioner.removeWorkerType(this.props.workerType).then(function() {
      return that.props.reload();
    });
  },
});

var WorkerTypeCreator = React.createClass({
  getInitialState() {
    return {
      alertVisible: false
    };
  },

  render() {
    if (this.state.alertVisible) {
      return (
        <bs.Alert bsStyle='default' onDismiss={this.handleAlertDismiss}>
          <WorkerTypeEdit />
          <bs.Button bsSize='xsmall' onClick={this.handleAlertDismiss}>Dismiss</bs.Button>
        </bs.Alert>
      );
    }

    return (
      <bs.Button onClick={this.handleAlertShow}>Create Worker Type</bs.Button>
    );
  },

  handleAlertDismiss() {
    this.setState({alertVisible: false});
  },

  handleAlertShow() {
    this.setState({alertVisible: true});
  }
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
        <WorkerTypeCreator />
        <WorkerTypeTable selectWorkerType={this.selectWorkerType} />
        { workerTypeDetail ? workerTypeDetail : '' }
        </div>
    );
  },

});

// Export IndexBrowser
module.exports = AwsProvisioner;
