let _ = require('lodash');
let React = require('react');
let bs = require('react-bootstrap');
let utils = require('../lib/utils');
let taskcluster = require('taskcluster-client');
let TaskView = require('./taskview');
let format = require('../lib/format');
let PreviousTasks = require('../lib/ui/previoustasks');

const VALID_SLUG_ID = /^[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]$/;

/** Renders task-group-inspector with a control to enter `taskGroupId` into */
let TaskGroupInspector = React.createClass({
  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      clients: {
        queue: taskcluster.Queue,
        queueEvents: taskcluster.QueueEvents
      },
      // Reload when state.taskGroupId changes, ignore credential changes
      reloadOnKeys: ['taskGroupId'],
      reloadOnLogin: false
    }),
    // Called handler when state.taskGroupId changes
    utils.createWatchStateMixin({
      onKeys: {
        updateTaskGroupIdInput: ['taskGroupId'],
        loadTaskStatus: ['taskId']
      }
    }),
    // Listen for messages, reload bindings() when state.taskGroupId changes
    utils.createWebListenerMixin({ reloadOnKeys: ['taskGroupId'] }),
    // Serialize state.taskGroupId to location.hash as string
    utils.createLocationHashMixin({
      keys: ['taskGroupId', 'taskId'],
      type: 'string'
    })
  ],

  /** Get initial state */
  getInitialState: function() {
    return {
      taskGroupId: '',
      taskId: null,
      taskGroupLoaded: true,
      taskGroupError: null,
      taskGroup: null,
      taskGroupIdInput: ''
    };
  },

  /**
   * Recursively fetch tasks from Queue#listTaskGroup while the results contain
   * a continuation token. This method will batch collected tasks until the
   * requests are drained of all continuations.
   */
  async listTaskGroup(taskGroupId) {
    let continuationToken = null;
    let tasks = [];

    do {
      let payload = {};

      if (!continuationToken) {
        payload.limit = 20;
      } else {
        payload.continuationToken = continuationToken;
      }

      let result = await this.queue.listTaskGroup(taskGroupId, payload);

      tasks.push(...result.tasks);

      this.setState({
        taskGroup: { taskGroupId, tasks }
      });

      continuationToken = result.continuationToken;
    } while (continuationToken);
  },

  /** Return promised state for TaskClusterMixin */
  load: function() {
    // Skip loading empty-strings
    if (!this.state.taskGroupId) {
      return { taskGroup: null };
    }

    this.listTaskGroup(this.state.taskGroupId);
  },

  /** Load task status structure for state.taskId */
  loadTaskStatus: function() {
    // If we don't have a taskId to load, just don't even try
    if (!this.state.taskId) {
      return;
    }

    // If a taskId is selected we should load the status structure for it
    let promisedState = {};
    let key = 'task/' + this.state.taskId + '/status';

    promisedState[key] = this.queue
      .status(this.state.taskId)
      .then(_.property('status'));

    this.loadState(promisedState);
  },

  /** Update taskGroupId input field when taskGroupId changes */
  updateTaskGroupIdInput: function() {
    // This handle changes that occurs due to modifications of location.hash
    this.setState({ taskGroupIdInput: this.state.taskGroupId });
  },

  /** Return bindings for WebListenerMixin */
  bindings: function() {
    // Don't bother listening for empty strings, they're pretty boring
    if (this.state.taskGroupId) {
      return [];
    }

    // Create common routing key for queue events and task group events
    let qkey = { taskGroupId: this.state.taskGroupId };

    // Return all interesting bindings
    return [
      this.queueEvents.taskDefined(qkey),
      this.queueEvents.taskPending(qkey),
      this.queueEvents.taskRunning(qkey),
      this.queueEvents.artifactCreated(qkey),
      this.queueEvents.taskCompleted(qkey),
      this.queueEvents.taskFailed(qkey),
      this.queueEvents.taskException(qkey)
    ];
  },

  /** Handle message from listener */
  handleMessage: function(message) {
    // Find queue exchanges
    let queueExchanges = [
      this.queueEvents.taskDefined().exchange,
      this.queueEvents.taskPending().exchange,
      this.queueEvents.taskRunning().exchange,
      this.queueEvents.artifactCreated().exchange,
      this.queueEvents.taskCompleted().exchange,
      this.queueEvents.taskFailed().exchange,
      this.queueEvents.taskException().exchange
    ];

    // Dispatch to handleQueueMessage or handleSchedulerMessage
    if (_.includes(queueExchanges, message.exchange)) {
      this.handleQueueMessage(message);
    }
  },

  /** Handle message from the queue */
  handleQueueMessage: function(message) {
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
    let taskGroup = _.clone(this.state.taskGroup);

    taskGroup.tasks = taskGroup.tasks.slice();

    // Find index of task entry
    let taskId  = message.payload.status.taskId;
    let index = _.findIndex(taskGroup.tasks, { taskId: taskId });

    if (index === -1) {
      return; // if not present, we can't update it
    }

    // Update task, if there is a last run, we update state and satisfied
    let task = _.cloneDeep(taskGroup.tasks[index]);
    let lastRun = _.last(message.payload.status.runs);

    if (lastRun) {
      task.state  = lastRun.state;
      task.satisfied = lastRun.success;
    }

    taskGroup.tasks[index] = task;

    // Create updated state
    let state = { taskGroup: taskGroup };

    // Cache status structure, we don't have to reload it if we select the task
    // and if it is already selected it'll be immediately updated
    state['task/' + taskId + '/status'] = message.payload.status;

    // Update state, use loadState to ensure that <key>Error and <key>Loaded
    // are set correctly
    this.loadState({ taskGroup: taskGroup });
  },

  /** Handle message from the scheduler */
  handleSchedulerMessage: function(message) {
    // If taskGroup isn't loaded yet, we wont try to update it
    if (!this.state.taskGroupLoaded || !this.state.taskGroup) {
      return;
    }

    // Clone taskGroup, shallow will do (just avoid modifying this.state)
    let taskGroup = _.clone(this.state.taskGroup);

    // Update task group status and update state
    taskGroup.status = message.payload.status;
    this.setState({ taskGroup: taskGroup });
  },

  /** When taskGroupId changed we should update the input */
  updateTaskGroupIdInput: function() {
    this.setState({ taskGroupIdInput: this.state.taskGroupId });
  },

  // Get taskId of selected task
  currentTaskId: function() {
    return this.state.taskId || this.state.taskGroup.tasks[0].taskId;
  },

  // Get status structure for current task
  currentTaskStatus: function() {
    let taskId = this.state.taskId;
    let status = this.state.groupResult.tasks[0].status;

    this.state.groupResult.tasks
      .forEach(function(task) {
        if (task.taskId === taskId) {
          status = task.status;
        }
      });

    return status;
  },

  // Render a task-group-inspector
  render: function() {
    // Decide if input is a valid slugid
    let invalidInput = !VALID_SLUG_ID.test(this.state.taskGroupIdInput);

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
              <bs.Input
                type="text"
                ref="taskGroupId"
                placeholder="taskGroupId"
                value={this.state.taskGroupIdInput}
                label={<span>Enter <code>taskGroupId</code></span>}
                bsStyle={invalidInput ? 'error' : null}
                onChange={this.handleTaskGroupIdInputChange}
                hasFeedback
                labelClassName="col-sm-3"
                wrapperClassName="col-sm-9" />

              <div className="col-sm-offset-3 col-sm-9">
                <input type="submit"
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
  renderTaskGroup: function() {
    // If there is no taskGroup we just render nothing, this should only
    // happen initially when taskGroup === null
    if (!this.state.taskGroup) {
      return;
    }

    // Get taskGroup to render
    let taskGroup = this.state.taskGroup;

    return (
      <div>
        <hr/>
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
  renderTaskTable: function() {
    let requiredTasks = [];
    let dependentTasks = [];
    let taskStateLabel = {
      unscheduled: 'label label-default',
      scheduled: 'label label-info',
      pending: 'label label-info',
      running: 'label label-primary',
      completed: 'label label-success',
      failed: 'label label-danger',
      exception: 'label label-warning'
    };

    this.state.taskGroup.tasks.forEach(function(item) {
      let task = item.task;
      let status = item.status;

      // Set dependent tasks, if we're accessing the current task
      if (status.taskId === this.state.taskId) {
        dependentTasks = task.dependencies;
      }

      // Check if the current task is required
      if (task.dependencies.indexOf(this.state.taskId) !== -1) {
        requiredTasks.push(status.taskId);
      }
    }, this);

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
            this.state.taskGroup.tasks.map(function(item) {
              let task = item.task;
              let status = item.status;
              let stateLabel = taskStateLabel[status.state];
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
                <tr key={status.taskId}
                    className={this.state.taskId === status.taskId ? 'info' : null}
                    onClick={this.handleSelectTask.bind(this, status.taskId)}>
                  <td><code>{status.taskId}</code></td>
                  <td>
                    <format.Markdown>
                      {task.metadata.name}
                    </format.Markdown>
                  </td>
                  <td>
                    <span className={stateLabel}>
                      {status.state}
                    </span>
                  </td>
                  <td>
                    {status.runs.length}
                  </td>
                  <td>{relation}</td>
                </tr>
              );
            }, this)
          }
          </tbody>
        </table>
      </div>
    );
  },

  /** Render taskview for currently selected task */
  renderTaskView: function() {
    // If nothing is selected don't try to load
    if (!this.state.taskId) {
      return;
    }

    let key = 'task/' + this.state.taskId + '/status';

    // Wait for status structure to be loaded (or one selected)
    let waitFor = this.renderWaitFor(key);

    if (waitFor || !this.state[key]) {
      return waitFor;
    }

    // Find status structure from state
    let status = this.state[key];

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
  handleTaskGroupIdInputChange: function() {
    this.setState({
      taskGroupIdInput: this.refs.taskGroupId.getInputDOMNode().value.trim()
    });
  },

  /** Handle selection of a task */
  handleSelectTask: function(taskId) {
    this.setState({ taskId: taskId });
  },

  /** Handle form submission */
  handleSubmit: function(e) {
    e.preventDefault();
    this.setState({ taskGroupId: this.state.taskGroupIdInput });
  }
});

// Export TaskGroupInspector
module.exports = TaskGroupInspector;
