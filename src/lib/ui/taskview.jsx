import React, {Component} from 'react';
import {Nav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap';
import _ from 'lodash';
import path from 'path';
import taskcluster from 'taskcluster-client';
import {TaskClusterEnhance} from '../utils';
import TaskInfo from './taskinfo';
import RunInfo from './runinfo';
import ConfirmActionMenuItem from './ConfirmActionMenuItem';
import RetriggerMenuItem from './RetriggerMenuItem';
import PurgeCacheMenuItem from './PurgeCacheMenuItem';
import './taskview.less';

/** Takes a task status structure and renders tabs for taskInfo and runInfo */
class TaskView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      task: null,
      taskLoaded: false,
      taskError: null,
    };

    this.scheduleTask = this.scheduleTask.bind(this);
    this.cancelTask = this.cancelTask.bind(this);
    this.setCurrentTab = this.setCurrentTab.bind(this);
    this.load = this.load.bind(this);
    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
    this.handleArtifactCreatedMessage = this.handleArtifactCreatedMessage.bind(this);
  }

  componentWillMount() {
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.addEventListener('taskcluster-reload', this.load, false);

    this.load();
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.removeEventListener('taskcluster-reload', this.load, false);
  }

  componentDidUpdate(prevProps, prevState) {
    this.props.taskclusterState(this.state, this.props);
  }

  onTaskClusterUpdate({detail}) {
    if (detail.name !== this.constructor.name) {
      return;
    }

    this.setState(detail.state);
  }

  scheduleTask() {
    return this.props.clients.queue.scheduleTask(this.props.status.taskId);
  }

  cancelTask() {
    return this.props.clients.queue.cancelTask(this.props.status.taskId);
  }

  load(data) {
    if (typeof data === 'object' && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    const promisedState = {task: this.props.clients.queue.task(this.props.status.taskId)};

    this.props.loadState(promisedState);
  }

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
  }

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
      {...this.props}
      ref={instance => { this.runInfoInstance = instance; }}
      run={run}
      activeTabOnInit={this.props.match.params.section} />;
  }

  isNumber(term) {
    return !isNaN(parseInt(term));
  }

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
  }

  // Tell child that we got an artifact created message
  handleArtifactCreatedMessage(message) {
    if (this.runInfoInstance) {
      this.runInfoInstance.getWrappedInstance().handleArtifactCreatedMessage(message);
    }
  }
}

TaskView.defaultProps = {
  // Initial tab to show (empty string is task view)
  initialTab: ''
};

TaskView.propTypes = {status: React.PropTypes.object.isRequired};

const taskclusterOpts = {
  // Need updated clients for Queue
  clients: {
    queue: taskcluster.Queue,
  },
  // Reload when props.status.taskId changes, ignore credential changes
  reloadOnProps: ['status.taskId'],
  reloadOnLogin: false,
  name: TaskView.name
};

export default TaskClusterEnhance(TaskView, taskclusterOpts);
