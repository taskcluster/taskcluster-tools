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
          baseUrl:      'https://aws-provisioner.taskcluster.net/v1'
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
          {this.renderCapacityBar()}
          </bs.OverlayTrigger>
        </td>
        <td>{this.state.pendingTasks.pendingTasks}</td>
      </tr>
    );
  },

  renderCapacityBar() {
    // Without this try catch, we get no exception :(
    try {
      var p = this.doMath();
    } catch (e) {
      console.error(e);
    }
    //return <pre>{JSON.stringify(p, null, 2)}</pre>;

    return <bs.ProgressBar style={{marginBottom: 0}}>
      { p.r ?
        <bs.ProgressBar bsStyle='success' key='running' now={p.r} label={p.rc}/>
        : ''
      }
      { p.p ?
        <bs.ProgressBar bsStyle='warning' key='pending' now={p.p} label={p.pc}/>
        : ''
      }
      { p.s ?
        <bs.ProgressBar bsStyle='info' key='spotReq' now={p.s} label={p.sc}/>
        : ''
      }
    </bs.ProgressBar>
  },

  /* Return an object which has the fuzzed percentages to use for creating
   * progress bars and the unfuzzed capacities.  If we have a state with 0%, we
   * don't fuzz at all.  If we have 1-4%, we round to 5% and we don't fuzz
   * above 5% for the running, pending and requested numbers */
  doMath() {
    // Actual capacities
    var runningCap = this.runningCapacity();
    var pendingCap = this.pendingCapacity();
    var spotReqCap = this.spotReqCapacity();

    var maxCap = this.state.workerType.maxCapacity;

    // We want to make sure that if a bar is there that it's visible
    var smallestCapUnit = maxCap * 0.05;

    // Fuzz the percentages to make sure all bars are visible.  If we have a
    // state with 0%, we don't fuzz at all.  If we have 1-4%, we round to 5%
    // and we don't fuzz above 5%
    var fuzzedRunning = runningCap ? Math.max(runningCap, smallestCapUnit) : 0;
    var fuzzedPending = pendingCap ? Math.max(pendingCap, smallestCapUnit) : 0;
    var fuzzedSpotReq = spotReqCap ? Math.max(spotReqCap, smallestCapUnit) : 0;

    // Determine the number which we should use to figure out our percentages.
    // When we have less than the max configured, we use that setting.  When we
    // exceed that amount, we want to sum up all the capacity units
    var count = fuzzedRunning + fuzzedPending + fuzzedSpotReq;
    var divideBy = Math.max(maxCap, count);

    // Calculate the percentages to use for the bars.  These numbers are
    // invalid for other purposes
    var runPer = fuzzedRunning / divideBy;
    var pendPer = fuzzedPending / divideBy;
    var spotPer = fuzzedSpotReq / divideBy;

    return {
      r: runPer * 100,
      p: pendPer * 100,
      s: spotPer * 100,
      rc: runningCap,
      pc: pendingCap,
      sc: spotReqCap,
    };
  },

  runningCapacity() {
    return _.sum(this.props.awsState.running.map(instance => {
      return _.find(this.state.workerType.instanceTypes, {
        instanceType:     instance.type
      });
    }), 'capacity');
  },

  pendingCapacity() {
    return _.sum(this.props.awsState.pending.map(instance => {
      return _.find(this.state.workerType.instanceTypes, {
        instanceType:     instance.type
      });
    }), 'capacity');
  },

  spotReqCapacity() {
    return _.sum(this.props.awsState.spotReq.map(spotReq => {
      return _.find(this.state.workerType.instanceTypes, {
        instanceType:     spotReq.type
      });
    }), 'capacity');
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
  "minCapacity": 0,
  "maxCapacity": 5,
  "scalingRatio": 0,
  "minPrice": 0,
  "maxPrice": 0.6,
  "canUseOndemand": false,
  "canUseSpot": true,
  "instanceTypes": [
    {
      "instanceType": "c3.xlarge",
      "capacity": 1,
      "utility": 1,
      "secrets": {},
      "scopes": [],
      "userData": {},
      "launchSpec": {}
    },
  ],
  "regions": [
    {
      "region": "us-west-2",
      "secrets": {},
      "scopes": [],
      "userData": {},
      "launchSpec": {
        "ImageId": "ami-xx"
      }
    }
  ],
  "userData": {},
  "launchSpec": {
  },
  "secrets": {},
  "scopes": []
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
          baseUrl:      'https://aws-provisioner.taskcluster.net/v1'
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
