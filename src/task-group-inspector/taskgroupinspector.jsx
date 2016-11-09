import React from 'react';
import {findDOMNode} from 'react-dom';
import _ from 'lodash';
import * as utils from '../lib/utils';
import taskcluster from 'taskcluster-client';
import TaskView from './taskview';
import * as format from '../lib/format';
import PreviousTasks from '../lib/ui/previoustasks';
import {FormControl, FormGroup, ControlLabel} from 'react-bootstrap';
import './taskgroupinspector.less';

const VALID_SLUG = /^[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]$/;

/** Renders task-group-inspector with a control to enter `taskGroupId` into */
export default React.createClass({
  displayName: 'TaskGroupInspector',

  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      clients: {
        queue: taskcluster.Queue,
        queueEvents: taskcluster.QueueEvents,
      },
      // Reload when state.taskGroupId changes, ignore credential changes
      reloadOnKeys: ['taskGroupId'],
      reloadOnLogin: false,
    }),
    // Called handler when state.taskGroupId changes
    utils.createWatchStateMixin({
      onKeys: {
        updateTaskGroupIdInput: ['taskGroupId'],
        loadTaskStatus: ['taskId'],
      },
    }),
    // Listen for messages, reload bindings() when state.taskGroupId changes
    utils.createWebListenerMixin({reloadOnKeys: ['taskGroupId']}),
    // Serialize state.taskGroupId to location.hash as string
    utils.createLocationHashMixin({
      keys: ['taskGroupId', 'taskId'],
      type: 'string',
    }),
  ],

  /** Get initial state */
  getInitialState() {
    return {
      taskGroupId: '',
      taskId: null,
      taskGroupLoaded: true,
      taskGroupError: null,
      taskGroup: null,
      taskGroupIdInput: '',
    };
  },

  /**
   * Recursively fetch tasks from Queue#listTaskGroup while the results contain
   * a continuation token. This method will batch collected tasks until the
   * requests are drained of all continuations.
   */
  async listTaskGroup(taskGroupId) {
    let continuationToken = null;
    const tasks = [];

    /* eslint-disable babel/no-await-in-loop */
    do {
      const payload = {};

      if (!continuationToken) {
        payload.limit = 20;
      } else {
        payload.continuationToken = continuationToken;
      }

      const result = await this.queue.listTaskGroup(taskGroupId, payload);

      tasks.push(...result.tasks);

      this.setState({
        taskGroup: {taskGroupId, tasks},
      });

      continuationToken = result.continuationToken;
    } while (continuationToken);
    /* eslint-enable babel/no-await-in-loop */
  },

  /** Return promised state for TaskClusterMixin */
  load() {
    // Skip loading empty-strings
    if (!this.state.taskGroupId) {
      return {taskGroup: null};
    }

    this.listTaskGroup(this.state.taskGroupId);
  },

  /** Load task status structure for state.taskId */
  loadTaskStatus() {
    // If we don't have a taskId to load, just don't even try
    if (!this.state.taskId) {
      return;
    }

    // If a taskId is selected we should load the status structure for it
    const promisedState = {};
    const key = `task/${this.state.taskId}/status`;

    promisedState[key] = this.queue
      .status(this.state.taskId)
      .then(_.property('status'));

    this.loadState(promisedState);
  },

  /** Update taskGroupId input field when taskGroupId changes */
  updateTaskGroupIdInput() {
    // This handle changes that occurs due to modifications of location.hash
    this.setState({taskGroupIdInput: this.state.taskGroupId});
  },

  /** Return bindings for WebListenerMixin */
  bindings() {
    // Don't bother listening for empty strings, they're pretty boring
    if (this.state.taskGroupId) {
      return [];
    }

    // Create common routing key for queue events and task group events
    const qkey = {taskGroupId: this.state.taskGroupId};

    // Return all interesting bindings
    return [
      this.queueEvents.taskDefined(qkey),
      this.queueEvents.taskPending(qkey),
      this.queueEvents.taskRunning(qkey),
      this.queueEvents.artifactCreated(qkey),
      this.queueEvents.taskCompleted(qkey),
      this.queueEvents.taskFailed(qkey),
      this.queueEvents.taskException(qkey),
    ];
  },

  /** Handle message from listener */
  handleMessage(message) {
    // Find queue exchanges
    const queueExchanges = [
      this.queueEvents.taskDefined().exchange,
      this.queueEvents.taskPending().exchange,
      this.queueEvents.taskRunning().exchange,
      this.queueEvents.artifactCreated().exchange,
      this.queueEvents.taskCompleted().exchange,
      this.queueEvents.taskFailed().exchange,
      this.queueEvents.taskException().exchange,
    ];

    // Dispatch to handleQueueMessage or handleSchedulerMessage
    if (_.includes(queueExchanges, message.exchange)) {
      this.handleQueueMessage(message);
    }
  },

  /** Handle message from the queue */
  handleQueueMessage(message) {
    // Notify children of artifact created messages, don't worry filtering
    // will take place in the RunInfo component
    if (message.exchange === this.queueEvents.artifactCreated().exchange) {
      if (this.refs.taskView) {
        this.refs.taskView.handleArtifactCreatedMessage(message);
      }
    }

    // If taskGroup isn't loaded yet, we wont try to update it
    if (!this.state.taskGroupLoaded || !this.state.taskGroup) {
      return;
    }

    // Shallow taskGroup and taskGroup.tasks clone will probably do
    const taskGroup = _.clone(this.state.taskGroup);

    taskGroup.tasks = taskGroup.tasks.slice();

    // Find index of task entry
    const {taskId} = message.payload.status;
    const index = _.findIndex(taskGroup.tasks, {taskId});

    if (index === -1) {
      return; // if not present, we can't update it
    }

    // Update task, if there is a last run, we update state and satisfied
    const task = _.cloneDeep(taskGroup.tasks[index]);
    const lastRun = _.last(message.payload.status.runs);

    if (lastRun) {
      task.state = lastRun.state;
      task.satisfied = lastRun.success;
    }

    taskGroup.tasks[index] = task;

    // Create updated state
    const state = {taskGroup};

    // Cache status structure, we don't have to reload it if we select the task
    // and if it is already selected it'll be immediately updated
    state[`task/${taskId}/status`] = message.payload.status;

    // Update state, use loadState to ensure that <key>Error and <key>Loaded
    // are set correctly
    this.loadState({taskGroup});
  },

  /** Handle message from the scheduler */
  handleSchedulerMessage(message) {
    // If taskGroup isn't loaded yet, we wont try to update it
    if (!this.state.taskGroupLoaded || !this.state.taskGroup) {
      return;
    }

    // Clone taskGroup, shallow will do (just avoid modifying this.state)
    const taskGroup = _.clone(this.state.taskGroup);

    // Update task group status and update state
    taskGroup.status = message.payload.status;
    this.setState({taskGroup});
  },

  // Get taskId of selected task
  currentTaskId() {
    return this.state.taskId || this.state.taskGroup.tasks[0].taskId;
  },

  // Get status structure for current task
  currentTaskStatus() {
    const taskId = this.state.taskId;
    let status = this.state.groupResult.tasks[0].status;

    this.state.groupResult.tasks
      .forEach(task => {
        if (task.taskId === taskId) {
          status = task.status;
        }
      });

    return status;
  },

  // Render a task-group-inspector
  render() {
    // Decide if input is a valid slugid
    const invalidInput = !VALID_SLUG.test(this.state.taskGroupIdInput);

    // Render some form input area
    return (
      <div>
        <h1>Task Group Inspector</h1>
        <p>
          This tool lets you inspect a task group given the <code>taskGroupId</code>
        </p>
        <form className="form-horizontal" onSubmit={this.handleSubmit}>
          <div className="list">
            <div className="col-sm-9">
              <FormGroup validationState={invalidInput ? 'error' : null}>
                <ControlLabel className="col-sm-3"><span>Enter <code>TaskGraphId</code></span></ControlLabel>
                <div className="col-sm-9">
                  <FormControl
                    type="text"
                    ref="taskGroupId"
                    placeholder="taskGroupId"
                    value={this.state.taskGroupIdInput}
                    onChange={this.handleTaskGroupIdInputChange} />
                  <FormControl.Feedback />
                </div>
              </FormGroup>

              <div className="col-sm-offset-3 col-sm-9">
                <input
                  type="submit"
                  className="btn btn-primary"
                  disabled={!this.state.taskGroupLoaded || invalidInput}
                  value="Inspect task group" />
              </div>
            </div>

            <div className="col-sm-3">
              <PreviousTasks objectId={this.state.taskGroupId} objectType="taskGroupId" />
            </div>

            <div className="form-group"></div>
          </div>
        </form>
        {this.renderWaitFor('taskGroup') || this.renderTaskGroup()}
      </div>
    );
  },

  /** Render task group once it has loaded */
  renderTaskGroup() {
    // If there is no taskGroup we just render nothing, this should only
    // happen initially when taskGroup === null
    if (!this.state.taskGroup) {
      return;
    }

    // Get taskGroup to render
    const taskGroup = this.state.taskGroup;

    return (
      <div>
        <hr />
        <dl className="dl-horizontal">
          <dt>taskGroupId</dt>
          <dd><code>{taskGroup.taskGroupId}</code></dd>
        </dl>
        <div className="results-container row">
          {this.renderTaskTable()}
          {this.renderTaskView()}
        </div>
      </div>
    );
  },

  /** Render table of tasks in a task group */
  renderTaskTable() {
    const requiredTasks = [];
    let dependentTasks = [];
    const taskStateLabel = {
      unscheduled: 'label label-default',
      scheduled: 'label label-info',
      pending: 'label label-info',
      running: 'label label-primary',
      completed: 'label label-success',
      failed: 'label label-danger',
      exception: 'label label-warning',
    };

    this.state.taskGroup.tasks.forEach(item => {
      const task = item.task;
      const status = item.status;

      // Set dependent tasks, if we're accessing the current task
      if (status.taskId === this.state.taskId) {
        dependentTasks = task.dependencies;
      }

      // Check if the current task is required
      if (task.dependencies.indexOf(this.state.taskId) !== -1) {
        requiredTasks.push(status.taskId);
      }
    });

    return (
      <div className="col-xs-5">
        <table className="table table-condensed task-group-inspector-tasks">
          <thead>
            <tr>
              <th>TaskId</th>
              <th>Name</th>
              <th>State</th>
              <th>Runs</th>
              <th>Relation</th>
            </tr>
          </thead>
          <tbody>
            {
              this.state.taskGroup.tasks.map(item => {
                const task = item.task;
                const status = item.status;
                const stateLabel = taskStateLabel[status.state];
                let relation = null;

                if (requiredTasks.indexOf(status.taskId) !== -1) {
                  relation = <span className={stateLabel}>required</span>;
                }

                if (dependentTasks.indexOf(status.taskId) !== -1) {
                  relation = <span className="label label-info">dependent</span>;
                }

                if (status.taskId === this.state.taskId) {
                  relation = '-';
                }

                return (
                  <tr
                    key={status.taskId}
                    className={this.state.taskId === status.taskId ? 'info' : null}
                    onClick={this.handleSelectTask.bind(this, status.taskId)}>
                    <td><code>{status.taskId}</code></td>
                    <td>
                      <format.Markdown>
                        {task.metadata.name}
                      </format.Markdown>
                    </td>
                    <td>
                      <span className={stateLabel}>{status.state}</span>
                    </td>
                    <td>{status.runs.length}</td>
                    <td>{relation}</td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    );
  },

  /** Render taskview for currently selected task */
  renderTaskView() {
    // If nothing is selected don't try to load
    if (!this.state.taskId) {
      return;
    }

    const key = `task/${this.state.taskId}/status`;

    // Wait for status structure to be loaded (or one selected)
    const waitFor = this.renderWaitFor(key);

    if (waitFor || !this.state[key]) {
      return waitFor;
    }

    // Find status structure from state
    const status = this.state[key];

    return (
      <div className="col-xs-7">
        <TaskView
          ref="taskView"
          hashEntry={this.nextHashEntry()}
          status={status}
          queue={this.props.queue} />
      </div>
    );
  },

  /** Update TaskGroupIdInput to reflect input */
  handleTaskGroupIdInputChange() {
    this.setState({
      taskGroupIdInput: findDOMNode(this.refs.taskGroupId).value.trim(),
    });
  },

  /** Handle selection of a task */
  handleSelectTask(taskId) {
    this.setState({taskId});
  },

  /** Handle form submission */
  handleSubmit(e) {
    e.preventDefault();
    this.setState({taskGroupId: this.state.taskGroupIdInput});
  },
});
