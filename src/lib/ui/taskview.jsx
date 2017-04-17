import React from 'react';
import {Nav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap';
import _ from 'lodash';
import path from 'path';
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
    })
  ],

  // Get initial state
  getInitialState() {
    return {
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
    const currentTab = this.isNumber(this.props.match.params.run) ? this.props.match.params.run : '';

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
        <Nav bsStyle="tabs" activeKey={currentTab} onSelect={this.setCurrentTab}>
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
            <RetriggerMenuItem task={this.state.task} taskId={this.props.status.taskId} {...this.props} />
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
    const currentTab = this.isNumber(this.props.match.params.run) ? this.props.match.params.run : '';

    // Empty string is the task tab, but zero is a possible value
    if (currentTab === '') {
      return <TaskInfo {...this.props} task={this.state.task} />;
    }

    // Check if we have the run in current tab
    const run = this.props.status.runs[currentTab];

    if (!run) {
      return (
        <div className="alert alert-danger">
          <strong>Run Not Found!</strong> The task does not seem to have the requested run.
        </div>
      );
    }

    // return a RunInfo
    return <RunInfo
      {...this.props} run={run} ref="runInfo" activeTabOnInit={this.props.match.params.section} />;
  },

  isNumber(term) {
    return !isNaN(parseInt(term));
  },

  // Set currentTab
  setCurrentTab(tab) {
    const {taskId, run} = this.props.match.params;
    const directory = this.props.match.url.split('/').filter(p => p.length)[0];
    let section = '';

    // Persist the section path of the URL if user is only switching between runs
    if (this.props.match.params.section && this.isNumber(tab) && this.isNumber(run)) {
      section = this.props.match.params.section;
    }

    // Add 'details' section to the URL if a run has no section path
    else if (!this.props.match.params.section && this.isNumber(tab)) {
      section = 'details';
    }

    this.props.history.push(path.join('/', directory, taskId, tab, section));
  },

  // Tell child that we got an artifact created message
  handleArtifactCreatedMessage(message) {
    if (this.refs.runInfo) {
      this.refs.runInfo.handleArtifactCreatedMessage(message);
    }
  },
});

export default TaskView;
