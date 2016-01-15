var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var _               = require('lodash');
var TaskView        = require('../lib/ui/taskview');
var format          = require('../lib/format');

/** Renders task-graph-inspector with a control to enter `taskGraphId` into */
var TaskGraphInspector = React.createClass({
  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      // Need updated clients for Queue, Scheduler and associated events
      clients: {
        scheduler:                taskcluster.Scheduler,
        schedulerEvents:          taskcluster.SchedulerEvents,
        queue:                    taskcluster.Queue,
        queueEvents:              taskcluster.QueueEvents
      },
      // Reload when state.taskGraphId changes, ignore credential changes
      reloadOnKeys:               ['taskGraphId'],
      reloadOnLogin:              false
    }),
    // Called handler when state.taskGraphId and state.taskId changes
    utils.createWatchStateMixin({
      onKeys: {
        updateTaskGraphIdInput:   ['taskGraphId'],
        loadTaskStatus:           ['taskId']
      }
    }),
    // Listen for messages, reload bindings() when state.taskGraphId changes
    utils.createWebListenerMixin({
      reloadOnKeys:               ['taskGraphId']
    }),
    // Serialize state.taskGraphId to location.hash as string
    utils.createLocationHashMixin({
      keys:                       ['taskGraphId', 'taskId'],
      type:                       'string'
    })
  ],

  /** Get initial state */
  getInitialState: function() {
    return {
      taskGraphId:        '',
      taskId:             null,
      taskGraphLoaded:    true,
      taskGraphError:     undefined,
      taskGraph:          null,
      taskGraphIdInput:   ''
      // Remark we'll cache task status structures under
      // 'task/<taskId>/status' as arrive from messages or when we load a
      // a task...
    };
  },

  /** Return promised state for TaskClusterMixin */
  load: function() {
    // Skip loading empty-strings
    if (this.state.taskGraphId === '') {
      return {
        taskGraph:      null
      };
    }

    // Construct promised state
    return {
      // Load task status and take the `status` key from the response
      taskGraph:        this.scheduler.inspect(this.state.taskGraphId)
    };
  },

  /** Load task status structure for state.taskId */
  loadTaskStatus: function() {
    // If we don't have a taskId to load, just don't even try
    if (!this.state.taskId || this.state.taskId === '') {
      return;
    }

    // If a taskId is selected we should load the status structure for it
    var promisedState = {};
    var key = 'task/' + this.state.taskId + '/status';
    promisedState[key] = this.queue.status(this.state.taskId)
                                   .then(_.property('status'));
    this.loadState(promisedState);
  },

  /** Update taskGraphId input field when taskGraphId changes */
  updateTaskGraphIdInput: function() {
    // This handle changes that occurs due to modifications of location.hash
    this.setState({taskGraphIdInput: this.state.taskGraphId});
  },

  /** Return bindings for WebListenerMixin */
  bindings: function() {
    // Don't bother listening for empty strings, they're pretty boring
    if (this.state.taskGraphId === '') {
      return [];
    }

    // Create common routing key for queue events
    var qkey = {taskGroupId: this.state.taskGraphId};

    // Create common routing key for task-graph events
    var skey = {taskGraphId: this.state.taskGraphId};

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
      this.schedulerEvents.taskGraphFinished(skey)
    ];
  },

  /** Handle message from listener */
  handleMessage: function(message) {
    // Find queue exchanges
    var queueExchanges = [
      this.queueEvents.taskDefined().exchange,
      this.queueEvents.taskPending().exchange,
      this.queueEvents.taskRunning().exchange,
      this.queueEvents.artifactCreated().exchange,
      this.queueEvents.taskCompleted().exchange,
      this.queueEvents.taskFailed().exchange,
      this.queueEvents.taskException().exchange
    ];

    // Dispatch to handleQueueMessage or handleSchedulerMessage
    if (_.contains(queueExchanges, message.exchange)) {
      this.handleQueueMessage(message);
    } else {
      this.handleSchedulerMessage(message);
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

    // If taskGraph isn't loaded yet, we wont try to update it
    if (!this.state.taskGraphLoaded || !this.state.taskGraph) {
      return;
    }

    // Shallow taskGraph and taskGraph.tasks clone will probably do
    var taskGraph = _.clone(this.state.taskGraph);
    taskGraph.tasks = taskGraph.tasks.slice();

    // Find index of task entry
    var taskId  = message.payload.status.taskId;
    var index   = _.findIndex(taskGraph.tasks, {taskId: taskId});
    if (index === -1) {
      return; // if not present, we can't update it
    }

    // Update task
    var task = _.cloneDeep(taskGraph.tasks[index]);

    // If there is a last run, we update state and satisfied
    var lastRun = _.last(message.payload.status.runs);
    if (lastRun) {
      task.state      = lastRun.state;
      task.satisfied  = lastRun.success;
    }
    taskGraph.tasks[index] = task;

    // Create updated state
    var state = {
      taskGraph:      taskGraph
    };

    // Cache status structure, we don't have to reload it if we select the task
    // and if it is already selected it'll be immediately updated
    state['task/' + taskId + '/status'] = message.payload.status;

    // Update state, use loadState to ensure that <key>Error and <key>Loaded
    // are set correctly
    this.loadState({taskGraph: taskGraph});
  },

  /** Handle message from the scheduler */
  handleSchedulerMessage: function(message) {
    // If taskGraph isn't loaded yet, we wont try to update it
    if (!this.state.taskGraphLoaded || !this.state.taskGraph) {
      return;
    }

    // Clone taskGraph, shallow will do (just avoid modifying this.state)
    var taskGraph = _.clone(this.state.taskGraph);
    // Update task-graph status
    taskGraph.status = message.payload.status;
    // Update state
    this.setState({taskGraph: taskGraph});
  },

  /** When taskGraphId changed we should update the input */
  updatetaskGraphIdInput: function() {
    this.setState({taskGraphIdInput: this.state.taskGraphId});
  },

  // Get taskId of selected task
  currentTaskId: function() {
    var taskId = this.state.taskId || this.state.taskGraph.tasks[0].taskId;
    return taskId;
  },

  // Get status structure for current task
  currentTaskStatus: function() {
    var taskId = this.state.taskId;
    var status = this.state.graphResult.tasks[0].status;
    this.state.graphResult.tasks.forEach(function(task) {
      if (task.taskId == taskId) {
        status = task.status;
      }
    });
    return status;
  },

  // Render a task-graph-inspector
  render: function() {
    // Decide if input is a valid slugid
    var invalidInput = !/^[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]$/.test(this.state.taskGraphIdInput);
    // Render some form input area
    return (
      <span>
      <h1>Task-Graph Inspector</h1>
      <p>
        This tool lets you inspect a task-graph given the <code>taskGraphId</code>
      </p>
      <form className="form-horizontal" onSubmit={this.handleSubmit}>
        <bs.Input
          type="text"
          ref="taskGraphId"
          placeholder="taskGraphId"
          value={this.state.taskGraphIdInput}
          label={<span>Enter <code>TaskGraphId</code></span>}
          bsStyle={invalidInput ? 'error' : null}
          onChange={this.handleTaskGraphIdInputChange}
          hasFeedback
          labelClassName="col-sm-3"
          wrapperClassName="col-sm-9"/>
        <div className="form-group">
          <div className="col-sm-offset-3 col-sm-9">
            <input type="submit"
                   className="btn btn-primary"
                   disabled={!this.state.taskGraphLoaded || invalidInput}
                   value="Inspect task-graph"/>
          </div>
        </div>
      </form>
      {this.renderWaitFor('taskGraph') || this.renderTaskGraph()}
      </span>
    );
  },

  /** Render task-graph once it has loaded */
  renderTaskGraph: function() {
    // If there is no taskGraph we just render nothing, this should only
    // happen initially when taskGraph === null
    if (!this.state.taskGraph) {
      return undefined;
    }

    // Get taskGraph to render
    var taskGraph = this.state.taskGraph;

    // Mapping from state to labels
    var taskGraphStateLabel = {
      running:          'label label-primary',
      finished:         'label label-success',
      blocked:          'label label-danger'
    };

    // Shorten source if necessary
    var source = taskGraph.metadata.source;
    if (source.length > 90) {
      source = "..." + source.substr(8 - 90);
    }

    return (
      <span>
      <hr/>
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
            taskGraph.scopes.length > 0 ? (
              <ul>
                {
                  taskGraph.scopes.map((scope, index) => {
                    return <li key={index}><code>{scope}</code></li>;
                  })
                }
              </ul>
            ) : (
              '-'
            )
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
      <hr/>
      {this.renderTaskView()}
      </span>
    );
  },

  /** Render table of tasks in a task-graph */
  renderTaskTable: function() {
    var taskStateLabel = {
      unscheduled:      'label label-default',
      scheduled:        'label label-info',
      pending:          'label label-info',
      running:          'label label-primary',
      completed:        'label label-success',
      failed:           'label label-danger',
      exception:        'label label-warning'
    };

    var requiredTasks = [];
    var dependentTasks = [];
    this.state.taskGraph.tasks.forEach(function(task) {
      // Set dependent tasks, if we're accessing the current task
      if (task.taskId == this.state.taskId) {
        dependentTasks = task.dependents;
      }
      // Check if the current task is required
      if (task.dependents.indexOf(this.state.taskId) !== -1) {
        requiredTasks.push(task.taskId);
      }
    }, this);
    return (
      <table className="table table-condensed task-graph-inspector-tasks">
        <thead>
          <tr>
            <th>TaskId</th>
            <th>Name</th>
            <th>State</th>
            <th>Satisfied</th>
            <th>Reruns</th>
            <th>Relation</th>
          </tr>
        </thead>
        <tbody>
        {
          this.state.taskGraph.tasks.map(function(task) {
            var stateLabel = taskStateLabel[task.state];
            var relation = null;
            if (requiredTasks.indexOf(task.taskId) !== -1) {
              relation = <span className={stateLabel}>required</span>;
            }
            if (dependentTasks.indexOf(task.taskId) !== -1) {
              relation = <span className="label label-info">dependent</span>;
            }
            if (task.taskId == this.state.taskId) {
              relation = '-';
            }
            return (
              <tr key={task.taskId}
                  className={this.state.taskId == task.taskId ? 'info' : null}
                  onClick={this.handleSelectTask.bind(this, task.taskId)}>
                <td><code>{task.taskId}</code></td>
                <td>
                  <format.Markdown>
                    {task.name}
                  </format.Markdown>
                </td>
                <td>
                  <span className={stateLabel}>
                    {task.state}
                  </span>
                </td>
                <td>
                  {
                    task.satisfied ?
                      <span className="label label-success">
                      Yes
                      </span>
                    :
                      <span className="label label-warning">
                      No
                      </span>
                  }
                </td>
                <td>
                  {task.reruns - task.rerunsLeft} of {task.reruns}
                </td>
                <td>{relation}</td>
              </tr>
            );
          }, this)
        }
        </tbody>
      </table>
    );
  },

  /** Render taskview for currently selected task */
  renderTaskView: function() {
    // If nothing is selected don't try to load
    if (!this.state.taskId || this.state.taskId === '') {
      return undefined;
    }
    // Wait for status structure to be loaded (or one selected)
    var waitFor = this.renderWaitFor('task/' + this.state.taskId + '/status');
    if (waitFor || !this.state['task/' + this.state.taskId + '/status']) {
      return waitFor;
    }

    // Find status structure from state
    var status = this.state['task/' + this.state.taskId + '/status'];

    return (
      <TaskView ref="taskView"
          hashEntry={this.nextHashEntry()}
          status={status}
          queue={this.props.queue}/>
    );
  },

  /** Update TaskGraphIdInput to reflect input */
  handleTaskGraphIdInputChange: function() {
    this.setState({
      taskGraphIdInput:   this.refs.taskGraphId.getInputDOMNode().value.trim()
    });
  },

  /** Handle selection of a task */
  handleSelectTask: function(taskId) {
    this.setState({taskId: taskId});
  },

  /** Handle form submission */
  handleSubmit: function(e) {
    e.preventDefault();
    this.setState({taskGraphId: this.state.taskGraphIdInput});
  }
});

// Export TaskGraphInspector
module.exports = TaskGraphInspector;

