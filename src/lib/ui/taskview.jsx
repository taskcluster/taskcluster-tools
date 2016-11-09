import React from 'react';
import {Nav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap';
import _ from 'lodash';
import taskcluster from 'taskcluster-client';
import * as utils from '../utils';
import TaskInfo from './taskinfo';
import RunInfo from './runinfo';
import ConfirmActionMenuItem from './ConfirmActionMenuItem';
import RetriggerMenuItem from './RetriggerMenuItem';
import PurgeCacheMenuItem from './PurgeCacheMenuItem';
import './taskview.less';

/** Takes a task status structure and renders tabs for taskInfo and runInfo */
const TaskView = React.createClass({
  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      // Need updated clients for Queue
      clients: {
        queue: taskcluster.Queue,
      },
      // Reload when props.status.taskId changes, ignore credential changes
      reloadOnProps: ['status.taskId'],
      reloadOnLogin: false,
    }),
    // Serialize state.currentTab to location.hash as string
    utils.createLocationHashMixin({
      keys: ['currentTab'],
      type: 'string',
    }),
  ],

  // Get initial state
  getInitialState() {
    return {
      // Empty string is the task view
      currentTab: this.props.initialTab,
      task: null,
      taskLoaded: false,
      taskError: null,
    };
  },

  // Create default properties
  getDefaultProps() {
    return {
      // Initial tab to show (empty string is task view)
      initialTab: '',
    };
  },

  // Validate properties
  propTypes: {
    status: React.PropTypes.object.isRequired,
  },

  scheduleTask() {
    return this.queue.scheduleTask(this.props.status.taskId);
  },

  cancelTask() {
    return this.queue.cancelTask(this.props.status.taskId);
  },

  load() {
    return {
      task: this.queue.task(this.props.status.taskId),
    };
  },

  // Render tabs and current tab
  render() {
    if (!this.state.task) {
      return null;
    }

    const isResolved = [
      'completed',
      'failed',
      'exception',
    ].indexOf(this.props.status.state) !== -1;

    return (
      <div className="task-view">
        <Nav bsStyle="tabs" activeKey={`${this.state.currentTab}`} onSelect={this.setCurrentTab}>
          <NavItem eventKey="" key="">Task Details</NavItem>
          <NavDropdown title="Actions" id="task-view-actions">
            <ConfirmActionMenuItem
              disabled={this.props.status.state !== 'unscheduled'}
              glyph="play"
              label="Schedule Task"
              action={this.scheduleTask}
              success="Successfully scheduled task!">
              Are you sure you wish to schedule the task? This will <strong>overwrite any
              scheduling process</strong> taking place. If this task is part of a continuous
              integration process scheduling this task may cause your code to land with broken
              tests.
            </ConfirmActionMenuItem>
            <RetriggerMenuItem task={this.state.task} taskId={this.props.status.taskId} />
            <ConfirmActionMenuItem
              disabled={isResolved}
              glyph="stop"
              label="Cancel Task"
              action={this.cancelTask}
              success="Successfully canceled task!">
                Are you sure you wish to cancel this task? Note that another process or developer
                may still be able to schedule a rerun. All existing runs will be aborted and any
                scheduling process will not be able to schedule the task.
            </ConfirmActionMenuItem>
            <PurgeCacheMenuItem
              caches={_.keys(((this.state.task || {}).payload || {}).cache || {})}
              provisionerId={this.state.task.provisionerId}
              workerType={this.state.task.workerType} />
          </NavDropdown>
          <NavDropdown eventKey="runs" title="Runs" key="runs" id="task-view-runs">
            {this.props.status.runs.map(({runId}) => (
              <MenuItem eventKey={`${runId}`} key={`${runId}`}>
                Run {runId}
              </MenuItem>
            ))}
          </NavDropdown>
        </Nav>
        <div className="tab-content">
          <div className="tab-pane active">
            {this.renderCurrentTab()}
          </div>
        </div>
      </div>
    );
  },

  /** Render current tab */
  renderCurrentTab() {
    // Empty string is the task tab, but zero is a possible value
    if (this.state.currentTab === '') {
      return <TaskInfo status={this.props.status} task={this.state.task} />;
    }

    // Check if we have the run in current tab
    const run = this.props.status.runs[this.state.currentTab];

    if (!run) {
      return (
        <div className="alert alert-danger">
          <strong>Run Not Found!</strong> The task does not seem to have the requested run.
        </div>
      );
    }

    // return a RunInfo
    return <RunInfo status={this.props.status} run={run} ref="runInfo" />;
  },

  // Set currentTab
  setCurrentTab(tab) {
    // Update state
    this.setState({
      currentTab: tab,
    });
  },

  // Tell child that we got an artifact created message
  handleArtifactCreatedMessage(message) {
    if (this.refs.runInfo) {
      this.refs.runInfo.handleArtifactCreatedMessage(message);
    }
  },
});

export default TaskView;
