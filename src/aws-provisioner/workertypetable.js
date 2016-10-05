import React from 'react';
import {
  OverlayTrigger,
  ProgressBar,
  Tooltip,
  ButtonToolbar,
  Button,
  Glyphicon,
  Table
} from 'react-bootstrap';
import * as utils from '../lib/utils';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import WorkerTypeView from './workertypeview';
import WorkerTypeEditor from './workertypeeditor';
import './aws-provisioner.less';

const WorkerTypeRow = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        queue: taskcluster.Queue,
        awsProvisioner: taskcluster.AwsProvisioner
      },
      clientOpts: {
        awsProvisioner: {
          baseUrl: 'https://aws-provisioner.taskcluster.net/v1'
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
    workerType: React.PropTypes.shape({
      workerType: React.PropTypes.string.isRequired,
      minCapacity: React.PropTypes.number.isRequired,
      maxCapacity: React.PropTypes.number.isRequired,
      requestedCapacity: React.PropTypes.number.isRequired,
      pendingCapacity: React.PropTypes.number.isRequired,
      runningCapacity: React.PropTypes.number.isRequired
    }).isRequired,
    selected: React.PropTypes.bool.isRequired,
    onClick: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      pendingTasks: { pendingTasks: 0 },
      pendingTasksLoaded: false,
      pendingTasksError: null
    };
  },

  load() {
    return {
      pendingTasks: this.queue.pendingTasks(
        this.props.provisionerId,
        this.props.workerType.workerType
      )
    };
  },

  render() {
    return (
      <tr
        onClick={this.props.onClick}
        className={this.props.selected ? 'active' : null}
        style={{ cursor: 'pointer' }}>
          <td><code>{this.props.workerType.workerType}</code></td>
          <td>
            <OverlayTrigger placement="left" overlay={this.tooltip()}>
              {this.renderCapacityBar()}
            </OverlayTrigger>
          </td>
          <td>{this.state.pendingTasksLoaded ? this.state.pendingTasks.pendingTasks : '...'}</td>
      </tr>
    );
  },

  renderCapacityBar() {
    const progress = this.doMath();
    const progressBars = [];

    if (progress.r) {
      progressBars.push(
        <ProgressBar bsStyle="success" key="running" now={progress.r} label={progress.rc} />
      );
    }

    if (progress.p) {
      progressBars.push(
        <ProgressBar bsStyle="warning" key="pending" now={progress.p} label={progress.pc} />
      );
    }

    if (progress.s) {
      progressBars.push(
        <ProgressBar bsStyle="info" key="spotReq" now={progress.s} label={progress.sc} />
      );
    }

    return <ProgressBar>{progressBars}</ProgressBar>;
  },

  /* Return an object which has the fuzzed percentages to use for creating
   * progress bars and the unfuzzed capacities.  If we have a state with 0%, we
   * don't fuzz at all.  If we have 1-4%, we round to 5% and we don't fuzz
   * above 5% for the running, pending and requested numbers */
  doMath() {
    // Actual capacities
    const runningCap = this.props.workerType.runningCapacity;
    const pendingCap = this.props.workerType.pendingCapacity;
    const spotReqCap = this.props.workerType.requestedCapacity;
    const maxCap = this.props.workerType.maxCapacity;

    // We want to make sure that if a bar is there that it's visible
    const smallestCapUnit = maxCap * 0.05;

    // Fuzz the percentages to make sure all bars are visible.  If we have a
    // state with 0%, we don't fuzz at all.  If we have 1-4%, we round to 5%
    // and we don't fuzz above 5%
    const fuzzedRunning = runningCap ? Math.max(runningCap, smallestCapUnit) : 0;
    const fuzzedPending = pendingCap ? Math.max(pendingCap, smallestCapUnit) : 0;
    const fuzzedSpotReq = spotReqCap ? Math.max(spotReqCap, smallestCapUnit) : 0;

    // Determine the number which we should use to figure out our percentages.
    // When we have less than the max configured, we use that setting.  When we
    // exceed that amount, we want to sum up all the capacity units
    const count = fuzzedRunning + fuzzedPending + fuzzedSpotReq;
    const divideBy = Math.max(maxCap, count);

    // Calculate the percentages to use for the bars.  These numbers are
    // invalid for other purposes
    const runPer = fuzzedRunning / divideBy;
    const pendPer = fuzzedPending / divideBy;
    const spotPer = fuzzedSpotReq / divideBy;

    return {
      r: runPer * 100,
      p: pendPer * 100,
      s: spotPer * 100,
      rc: runningCap,
      pc: pendingCap,
      sc: spotReqCap
    };
  },

  tooltip() {
    return (
      <Tooltip id={this.props.workerType.workerType}>
        {this.props.workerType.workerType} has
        running capacity to handle {this.props.workerType.runningCapacity || '0'} tasks,
        pending instances to handle {this.props.workerType.pendingCapacity || '0'} tasks, and
        spot requests for capacity to
        handle {this.props.workerType.requestedCapacity || '0'} tasks in parallel.
      </Tooltip>
    );
  }
});

const defaultWorkerType = {
  minCapacity: 0,
  maxCapacity: 5,
  scalingRatio: 0,
  minPrice: 0,
  maxPrice: 0.6,
  canUseOndemand: false,
  canUseSpot: true,
  instanceTypes: [
    {
      instanceType: 'c3.xlarge',
      capacity: 1,
      utility: 1,
      secrets: {},
      scopes: [],
      userData: {},
      launchSpec: {}
    }
  ],
  regions: [
    {
      region: 'us-west-2',
      secrets: {},
      scopes: [],
      userData: {},
      launchSpec: {
        ImageId: 'ami-xx'
      }
    }
  ],
  userData: {},
  launchSpec: {},
  secrets: {},
  scopes: []
};

/** Table of workerTypes */
export default React.createClass({
  displayName: 'WorkerTypeTable',

  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        awsProvisioner: taskcluster.AwsProvisioner
      },
      clientOpts: {
        awsProvisioner: {
          baseUrl: 'https://aws-provisioner.taskcluster.net/v1'
        }
      },
      reloadOnProps: [
        'provisionerId'
      ]
    }),
    utils.createLocationHashMixin({
      keys: ['selected'],
      type: 'string'
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
      workerTypeSummaries: [],
      workerTypeSummariesLoaded: false,
      workerTypeSummariesError: null,
      workerTypeContains: ''
    };
  },

  load() {
    return {
      workerTypeSummaries: this.awsProvisioner.listWorkerTypeSummaries()
    };
  },

  setSelected(workerType) {
    this.setState({ selected: workerType });
  },

  render() {
    return (
      <div>
        {
          this.state.selected === 'create:worker-type' ?
            this.renderWorkerTypeCreator() :
            this.renderWorkerTypeView()
        }
        <ButtonToolbar className="pull-right">
          <Button
            bsStyle="primary"
            bsSize="sm"
            onClick={this.setSelected.bind(this, 'create:worker-type')}
            style={{ marginTop: -10, padding: '3px 12px' }}>
            <Glyphicon glyph="plus" /> Create WorkerType
          </Button>
        </ButtonToolbar>
        <span>{this.renderWaitFor('workerTypeSummaries') || this.renderWorkerTypeTable()}</span>
      </div>
    );
  },

  renderTypeInput() {
    const setWorkerType = e => this.setState({ workerTypeContains: e.target.value });
    const enterWorkerType = e => {
      if (e.keyCode === 13) {
        e.preventDefault();
        setWorkerType(e);
      }
    };

    return (
      <div className="form-group form-group-sm">
        <div className="input-group">
          <div className="input-group-addon text-sm"><em>WorkerTypes containing</em></div>
          <input
            type="search"
            className="form-control"
            defaultValue={this.state.workerTypeContains}
            onBlur={setWorkerType}
            onKeyUp={enterWorkerType}/>
          <div className="input-group-addon">
            <Glyphicon glyph="search" />
          </div>
        </div>
      </div>
    );
  },

  renderWorkerTypeTable() {
    return (
      <div>
        <h4>Worker Types</h4>
        {this.renderTypeInput()}
        <Table style={{ marginTop: 20 }}>
          <thead>
            <tr>
              <th className="col-xs-2">WorkerType</th>
              <th>Capacity</th>
              <th className="col-xs-2">Pending Tasks</th>
            </tr>
          </thead>
          <tbody>
          {
            this.state.workerTypeSummaries
              .filter(workerType => workerType.workerType
                .includes(this.state.workerTypeContains))
              .map(workerType => (
                <WorkerTypeRow
                  key={workerType.workerType}
                  provisionerId={this.props.provisionerId}
                  workerType={workerType}
                  selected={this.state.selected === workerType.workerType}
                  onClick={() => this.setSelected(workerType.workerType)}
                  summary={workerType} />
              ))
          }
          </tbody>
        </Table>
      </div>
    );
  },

  renderWorkerTypeView() {
    if (!_.find(this.state.workerTypeSummaries, { workerType: this.state.selected })) {
      return;
    }

    return (
      <div style={{ marginBottom: 40 }}>
        <h4>Worker Type: <code>{this.state.selected}</code></h4>
        <hr />
        <WorkerTypeView
          provisionerId={this.props.provisionerId}
          workerType={this.state.selected}
          hashEntry={this.nextHashEntry()}
          reload={this.reload}
          updateSummary={this.updateSummary}/>
      </div>
    );
  },

  updateSummary(workerType, summary) {
    console.log('updateSummary', workerType, summary);

    // work around https://github.com/taskcluster/aws-provisioner/pull/70
    const workerTypeSummaries = this.state.workerTypeSummaries
      .map(wt => wt.workerType === workerType ?
        _.assign({ workerType }, summary) :
        wt
      );

    this.setState({ workerTypeSummaries });
  },

  renderWorkerTypeCreator() {
    return (
      <div style={{ marginBottom: 50 }}>
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
