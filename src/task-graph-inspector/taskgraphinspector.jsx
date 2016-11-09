import React from 'react';
import {findDOMNode} from 'react-dom';
import {Glyphicon, FormControl, FormGroup, ControlLabel} from 'react-bootstrap';
import * as utils from '../lib/utils';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import TaskSummary from '../lib/ui/tasksummary';
import * as format from '../lib/format';
import PreviousTasks from '../lib/ui/previoustasks';
import './taskgraphinspector.less';

const VALID_INPUT = /^[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]$/;

/** Renders task-graph-inspector with a control to enter `taskGraphId` into */
export default React.createClass({
  displayName: 'TaskGraphInspector',

  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      // Need updated clients for Queue, Scheduler and associated events
      clients: {
        scheduler: taskcluster.Scheduler,
        schedulerEvents: taskcluster.SchedulerEvents,
        queue: taskcluster.Queue,
        queueEvents: taskcluster.QueueEvents,
      },
      // Reload when state.taskGraphId changes, ignore credential changes
      reloadOnKeys: ['taskGraphId'],
      reloadOnLogin: false,
    }),
    // Called handler when state.taskGraphId and state.taskId changes
    utils.createWatchStateMixin({
      onKeys: {
        updateTaskGraphIdInput: ['taskGraphId'],
        loadTaskStatus: ['taskId'],
      },
    }),
    // Listen for messages, reload bindings() when state.taskGraphId changes
    utils.createWebListenerMixin({
      reloadOnKeys: ['taskGraphId'],
    }),
    // Serialize state.taskGraphId to location.hash as string
    utils.createLocationHashMixin({
      keys: ['taskGraphId', 'taskId'],
      type: 'string',
    }),
  ],

  /** Get initial state */
  getInitialState() {
    return {
      taskGraphId: '',
      taskId: null,
      taskGraphLoaded: true,
      taskGraphError: null,
      taskGraph: null,
      taskGraphIdInput: '',
      // Remark we'll cache task status structures under
      // 'task/<taskId>/status' as arrive from messages or when we load a
      // a task...
    };
  },

  /** Return promised state for TaskClusterMixin */
  load() {
    // Skip loading empty-strings
    if (this.state.taskGraphId === '') {
      return {
        taskGraph: null,
      };
    }

    // Construct promised state
    return {
      // Load task status and take the `status` key from the response
      taskGraph: this.scheduler.inspect(this.state.taskGraphId),
    };
  },

  /** Load task status structure for state.taskId */
  loadTaskStatus() {
    // If we don't have a taskId to load, just don't even try
    if (!this.state.taskId || this.state.taskId === '') {
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

  /** Update taskGraphId input field when taskGraphId changes */
  updateTaskGraphIdInput() {
    // This handle changes that occurs due to modifications of location.hash
    this.setState({taskGraphIdInput: this.state.taskGraphId});
  },

  /** Return bindings for WebListenerMixin */
  bindings() {
    // Don't bother listening for empty strings, they're pretty boring
    if (this.state.taskGraphId === '') {
      return [];
    }

    // Create common routing key for queue events
    const qkey = {taskGroupId: this.state.taskGraphId};

    // Create common routing key for task-graph events
    const skey = {taskGraphId: this.state.taskGraphId};

    // Return all interesting bindings
    return [
      this.queueEvents.taskDefined(qkey),
      this.queueEvents.taskPending(qkey),
      this.queueEvents.taskRunning(qkey),
      this.queueEvents.artifactCreated(qkey),
      this.queueEvents.taskCompleted(qkey),
      this.queueEvents.taskFailed(qkey),
      this.queueEvents.taskException(qkey),
      this.schedulerEvents.taskGraphRunning(skey),
      this.schedulerEvents.taskGraphExtended(skey),
      this.schedulerEvents.taskGraphBlocked(skey),
      this.schedulerEvents.taskGraphFinished(skey),
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
    } else {
      this.handleSchedulerMessage(message);
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

    // If taskGraph isn't loaded yet, we wont try to update it
    if (!this.state.taskGraphLoaded || !this.state.taskGraph) {
      return;
    }

    // Shallow taskGraph and taskGraph.tasks clone will probably do
    const taskGraph = _.clone(this.state.taskGraph);

    taskGraph.tasks = taskGraph.tasks.slice();

    // Find index of task entry
    const taskId = message.payload.status.taskId;
    const index = _.findIndex(taskGraph.tasks, {taskId});

    if (index === -1) {
      return; // if not present, we can't update it
    }

    // Update task
    const task = _.cloneDeep(taskGraph.tasks[index]);

    // If there is a last run, we update state and satisfied
    const lastRun = _.last(message.payload.status.runs);

    if (lastRun) {
      task.state = lastRun.state;
      task.satisfied = lastRun.success;
    }

    taskGraph.tasks[index] = task;

    // Create updated state
    const state = {
      taskGraph,
    };

    // Cache status structure, we don't have to reload it if we select the task
    // and if it is already selected it'll be immediately updated
    state[`task/${taskId}/status`] = message.payload.status;

    // Update state, use loadState to ensure that <key>Error and <key>Loaded
    // are set correctly
    this.loadState({taskGraph});
  },

  /** Handle message from the scheduler */
  handleSchedulerMessage(message) {
    // If taskGraph isn't loaded yet, we wont try to update it
    if (!this.state.taskGraphLoaded || !this.state.taskGraph) {
      return;
    }

    // Clone taskGraph, shallow will do (just avoid modifying this.state)
    const taskGraph = _.clone(this.state.taskGraph);

    // Update task-graph status
    taskGraph.status = message.payload.status;

    // Update state
    this.setState({taskGraph});
  },

  /** When taskGraphId changed we should update the input */
  updatetaskGraphIdInput() {
    this.setState({taskGraphIdInput: this.state.taskGraphId});
  },

  // Get taskId of selected task
  currentTaskId() {
    const taskId = this.state.taskId || this.state.taskGraph.tasks[0].taskId;
    return taskId;
  },

  // Get status structure for current task
  currentTaskStatus() {
    const taskId = this.state.taskId;
    let status = this.state.graphResult.tasks[0].status;

    this.state.graphResult.tasks.forEach(task => {
      if (task.taskId === taskId) {
        status = task.status;
      }
    });

    return status;
  },

  // Render a task-graph-inspector
  render() {
    // Decide if input is a valid slugid
    const invalidInput = !VALID_INPUT.test(this.state.taskGraphIdInput);
    // Render some form input area
    return (
      <div>
        <h1>Task-Graph Inspector</h1>
        <p>
          This tool lets you inspect a task-graph given the <code>taskGraphId</code>
        </p>
        <form className="form-horizontal" onSubmit={this.handleSubmit}>
          <div className="list">
            <div className="col-sm-9">
              <FormGroup validationState={invalidInput ? 'error' : null}>
                <ControlLabel className="col-sm-3"><span>Enter <code>TaskGraphId</code></span></ControlLabel>
                <div className="col-sm-9">
                  <FormControl
                    type="text"
                    ref="taskGraphId"
                    placeholder="taskGraphId"
                    value={this.state.taskGraphIdInput}
                    onChange={this.handleTaskGraphIdInputChange} />
                  <FormControl.Feedback />
                </div>
              </FormGroup>

              <div className="col-sm-offset-3 col-sm-9">
                <input
                  type="submit"
                  className="btn btn-primary"
                  disabled={!this.state.taskGraphLoaded || invalidInput}
                  value="Inspect task-graph" />
              </div>
            </div>

            <div className="col-sm-3">
              <PreviousTasks objectId={this.state.taskGraphId} objectType="taskGraphId" />
            </div>

            <div className="form-group">
            </div>
          </div>
        </form>
        {this.renderWaitFor('taskGraph') || this.renderTaskGraph()}
      </div>
    );
  },

  /** Render task-graph once it has loaded */
  renderTaskGraph() {
    // If there is no taskGraph we just render nothing, this should only
    // happen initially when taskGraph === null
    if (!this.state.taskGraph) {
      return;
    }

    // Get taskGraph to render
    const taskGraph = this.state.taskGraph;

    // Mapping from state to labels
    const taskGraphStateLabel = {
      running: 'label label-primary',
      finished: 'label label-success',
      blocked: 'label label-danger',
    };

    // Shorten source if necessary
    const source = taskGraph.metadata.source.length > 90 ?
      `...${taskGraph.metadata.source.substr(8 - 90)}` :
      taskGraph.metadata.source;

    return (
      <div>
        <hr />
        <dl className="dl-horizontal">
          <dt>Name</dt>
          <dd>
            <format.Markdown>
              {taskGraph.metadata.name}
            </format.Markdown>
          </dd>
          <dt>Description</dt>
          <dd>
            <format.Markdown>
              {taskGraph.metadata.description}
            </format.Markdown>
          </dd>
          <dt>Owner</dt>
          <dd><code>{taskGraph.metadata.owner}</code></dd>
          <dt>Source</dt>
          <dd>
            <a href={taskGraph.metadata.source}>
              {source}
            </a>
          </dd>
          <dt>Graph Scopes</dt>
          <dd>
            {
              taskGraph.scopes.length ? (
                <ul>
                  {taskGraph.scopes.map((scope, key) => <li key={key}><code>{scope}</code></li>)}
                </ul>
              ) :
              '-'
            }
          </dd>
        </dl>
        <dl className="dl-horizontal">
          <dt>State</dt>
          <dd>
            <span className={taskGraphStateLabel[taskGraph.status.state]}>
              {taskGraph.status.state}
            </span>
          </dd>
          <dt>TaskGraphId</dt>
          <dd><code>{taskGraph.status.taskGraphId}</code></dd>
        </dl>
        {this.renderTaskTable()}
      </div>
    );
  },

  /** Render table of tasks in a task-graph */
  renderTaskTable() {
    const taskStateLabel = {
      unscheduled: 'label label-default',
      scheduled: 'label label-info',
      pending: 'label label-info',
      running: 'label label-primary',
      completed: 'label label-success',
      failed: 'label label-danger',
      exception: 'label label-warning',
    };

    const requiredTasks = [];
    let dependentTasks = [];

    this.state.taskGraph.tasks.forEach(task => {
      // Set dependent tasks, if we're accessing the current task
      if (task.taskId === this.state.taskId) {
        dependentTasks = task.dependents;
      }

      // Check if the current task is required
      if (task.dependents.includes(this.state.taskId)) {
        requiredTasks.push(task.taskId);
      }
    });

    return (
      <table className="table table-condensed task-graph-inspector-tasks">
        <thead>
          <tr>
            <th>&nbsp;</th>
            <th>TaskId</th>
            <th>Name</th>
            <th>State</th>
            <th>Satisfied</th>
            <th>Reruns</th>
            <th>Relation</th>
          </tr>
        </thead>
        <tbody>
          {this.state.taskGraph.tasks.map(task => {
            const stateLabel = taskStateLabel[task.state];
            let relation = null;

            if (requiredTasks.includes(task.taskId)) {
              relation = <span className={stateLabel}>required</span>;
            }

            if (dependentTasks.indexOf(task.taskId) !== -1) {
              relation = <span className="label label-info">dependent</span>;
            }

            if (task.taskId === this.state.taskId) {
              relation = '-';
            }

            return (
              <tr
                key={task.taskId}
                className={this.state.taskId === task.taskId ? 'info' : null}
                onClick={this.handleSelectTask.bind(this, task.taskId)}>
                <td>
                  <Glyphicon
                    glyph={this.state.taskId === task.taskId ? 'chevron-down' : 'chevron-right'} />
                </td>
                <td><code>{task.taskId}</code></td>
                <td>
                  {
                    this.state.taskId === task.taskId ?
                      this.renderTaskSummary() : (
                        <format.Markdown>{task.name}</format.Markdown>
                      )
                  }
                </td>
                <td>
                  <span className={stateLabel}>
                    {task.state}
                  </span>
                </td>
                <td>
                  {
                    task.satisfied ? (
                      <span className="label label-success">Yes</span>
                    ) : (
                      <span className="label label-warning">No</span>
                    )
                  }
                </td>
                <td>
                  {task.reruns - task.rerunsLeft} of {task.reruns}
                </td>
                <td>{relation}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  },

  /** Render taskSummary for currently selected task */
  renderTaskSummary() {
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

    return <TaskSummary status={status} />;
  },

  /** Update TaskGraphIdInput to reflect input */
  handleTaskGraphIdInputChange() {
    this.setState({
      taskGraphIdInput: findDOMNode(this.refs.taskGraphId).value.trim(),
    });
  },

  /** Handle selection of a task */
  handleSelectTask(taskId) {
    this.setState({taskId: this.state.taskId === taskId ? null : taskId});
  },

  /** Handle form submission */
  handleSubmit(e) {
    e.preventDefault();
    this.setState({taskGraphId: this.state.taskGraphIdInput});
  },
});
