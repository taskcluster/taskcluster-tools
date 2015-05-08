var React             = require('react');
var bs                = require('react-bootstrap');
var utils             = require('../lib/utils');
var taskcluster       = require('taskcluster-client');
var _                 = require('lodash');
var format            = require('../lib/format');
var WorkerTypeView    = require('./workertypeview');
var WorkerTypeEditor  = require('./workertypeeditor');

var WorkerTypeRow = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        queue:          taskcluster.Queue,
        awsProvisioner: taskcluster.AwsProvisioner
      },
      clientOpts: {
        awsProvisioner: {
          baseUrl:      'https://taskcluster-aws-provisioner2.herokuapp.com/v1'
        }
      },
      reloadOnProps: [
        'provisionerId',
        'workerType'
      ]
    })
  ],

  propTypes: {
    provisionerId: React.PropTypes.string.isRequired,
    workerType: React.PropTypes.string.isRequired,
    awsState: React.PropTypes.shape({
      running: React.PropTypes.arrayOf(React.PropTypes.object),
      pending: React.PropTypes.arrayOf(React.PropTypes.object),
      spotReq: React.PropTypes.arrayOf(React.PropTypes.object),
    }).isRequired,
    selected: React.PropTypes.bool.isRequired,
    onClick: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      pendingTasks: {pendingTasks: 0},
      pendingTasksLoaded: false,
      pendingTasksError: undefined,
      workerType: {},
      workerTypeLoaded: false,
      workerTypeError: undefined
    };
  },

  load() {
    return {
      pendingTasks: this.queue.pendingTasks(
        this.props.provisionerId,
        this.props.workerType
      ),
      workerType: this.awsProvisioner.workerType(this.props.workerType)
    };
  },

  render() {
    var waitFor = this.renderWaitFor('workerType') ||
                  this.renderWaitFor('pendingTasks');
    return waitFor ? (
        <tr><td colSpan={3}>
        {waitFor}
        </td></tr>
      ) : (
      <tr
        onClick={this.props.onClick}
        className={this.props.selected ? 'active' : undefined}
        style={{cursor: 'pointer'}}>
        <td><code>{this.props.workerType}</code></td>
        <td>
          <bs.OverlayTrigger placement='left' overlay={this.tooltip()}>
            <bs.ProgressBar style={{marginBottom: 0}}>
              {this.runningBar()}
              {this.pendingBar()}
              {this.spotReqBar()}
            </bs.ProgressBar>
          </bs.OverlayTrigger>
        </td>
        <td>{this.state.pendingTasks.pendingTasks}</td>
      </tr>
    );
  },

  runningCapacity() {
    return _.sum(this.props.awsState.running.map(instance => {
      return _.find(this.state.workerType.instanceTypes, {
        instanceType:     instance.InstanceType
      });
    }), 'capacity');
  },

  pendingCapacity() {
    return _.sum(this.props.awsState.pending.map(instance => {
      return _.find(this.state.workerType.instanceTypes, {
        instanceType:     instance.InstanceType
      });
    }), 'capacity');
  },

  spotReqCapacity() {
    return _.sum(this.props.awsState.spotReq.map(spotReq => {
      return _.find(this.state.workerType.instanceTypes, {
        instanceType:     spotReq.LaunchSpecification.InstanceType
      });
    }), 'capacity');
  },

  runningBar() {
    var capacity = this.runningCapacity();
    return capacity == 0 ? undefined : (
      <bs.ProgressBar
        bsStyle='success'
        key='running'
        now={Math.max(0.05, capacity / this.state.workerType.maxCapacity) * 100}
        label={capacity}/>
    );
  },

  pendingBar() {
    var capacity = this.pendingCapacity();
    return capacity == 0 ? undefined : (
      <bs.ProgressBar
        bsStyle='info'
        key='pending'
        now={Math.max(0.05, capacity / this.state.workerType.maxCapacity) * 100}
        label={capacity}/>
    );
  },

  spotReqBar() {
    var capacity = this.spotReqCapacity();
    return capacity == 0 ? undefined : (
      <bs.ProgressBar
        bsStyle='warning'
        key='spot-requests'
        now={Math.max(0.05, capacity / this.state.workerType.maxCapacity) * 100}
        label={capacity}/>
    );
  },

  tooltip() {
    return (
      <bs.Tooltip>
        {this.props.workerType} has
        running capacity to handle {this.runningCapacity()  || '0'} tasks,
        pending instances to handle {this.pendingCapacity() || '0'} tasks, and
        spot requests for capacity to
        handle {this.spotReqCapacity()  || '0'} tasks in parallel.
      </bs.Tooltip>
    );
  }
});

const defaultWorkerType = {
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


/** Table of workerTypes */
var WorkerTypeTable = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        awsProvisioner: taskcluster.AwsProvisioner,
      },
      clientOpts: {
        awsProvisioner: {
          baseUrl:      'https://taskcluster-aws-provisioner2.herokuapp.com/v1'
        }
      },
      reloadOnProps: [
        'provisionerId'
      ]
    }),
    utils.createLocationHashMixin({
      keys:           ['selected'],
      type:           'string'
    })
  ],

  propTypes: {
    provisionerId: React.PropTypes.string.isRequired
  },

  getInitialState() {
    return {
      // selected workerType identifier (string)
      // or 'create:worker-type' to indicate creation of workerType
      selected: '',
      workerTypes: [],  // workerType identifier (string)
      workerTypesLoaded: true,
      workerTypesError: undefined,
      awsState: {},
      awsStateLoaded: true,
      awsStateError: undefined,
    };
  },

  load() {
    return {
      workerTypes: this.awsProvisioner.listWorkerTypes(),
      awsState: this.awsProvisioner.awsState(),
    };
  },

  setSelected(workerType) {
    this.setState({selected: workerType});
  },

  render() {
    return this.renderWaitFor('workerTypes') ||
           this.renderWaitFor('awsState') || (
      <span>
        {this.renderWorkerTypeTable()}
        <bs.ButtonToolbar>
          <bs.Button
            bsStyle='primary'
            onClick={this.setSelected.bind(this, 'create:worker-type')}
            style={{marginBottom: 10}}>
            <bs.Glyphicon glyph="plus"/>&nbsp;
            Create WorkerType
          </bs.Button>
        </bs.ButtonToolbar>
        {
          this.state.selected === 'create:worker-type' ? (
            this.renderWorkerTypeCreator()
          ) : (
            this.renderWorkerTypeView()
          )
        }
      </span>
    );
  },

  renderWorkerTypeTable() {
    return (
      <bs.Table>
        <thead>
          <th>WorkerType</th>
          <th className='col-md-6'>Capacity</th>
          <th>Pending Tasks</th>
        </thead>
        <tbody>
        {
          this.state.workerTypes.map(workerType => {
            // Find awsState for workerType
            var awsState = this.state.awsState[workerType] || {
              running: [],
              pending: [],
              spotReq: []
            };
            return <WorkerTypeRow
                      key={workerType}
                      provisionerId={this.props.provisionerId}
                      workerType={workerType}
                      selected={this.state.selected === workerType}
                      onClick={this.setSelected.bind(this, workerType)}
                      awsState={awsState}/>;
          })
        }
        </tbody>
      </bs.Table>
    );
  },

  renderWorkerTypeView() {
    if (!_.includes(this.state.workerTypes, this.state.selected)) {
      return undefined;
    }

    // Find awsState for workerType
    var awsState = this.state.awsState[this.state.selected] || {
      running: [],
      pending: [],
      spotReq: []
    };
    return (
      <div style={{marginBottom: 50}}>
        <hr/>
        <h2>WorkerType: <code>{this.state.selected}</code></h2>
        <WorkerTypeView
          provisionerId={this.props.provisionerId}
          workerType={this.state.selected}
          awsState={awsState}
          hashEntry={this.nextHashEntry()}
          reload={this.reload}/>
      </div>
    );
  },

  renderWorkerTypeCreator() {
    return (
      <div style={{marginBottom: 50}}>
        <hr/>
        <h2>Create New WorkerType</h2>
        <WorkerTypeEditor
          definition={defaultWorkerType}
          updated={this.workerTypeCreated}/>
      </div>
    );
  },

  async workerTypeCreated(workerType) {
    await this.reload();
    this.setSelected(workerType);
  }
});

// Export WorkerTypeTable
module.exports = WorkerTypeTable;
