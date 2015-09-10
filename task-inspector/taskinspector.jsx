var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var _               = require('lodash');
var TaskView        = require('../lib/ui/taskview');


/** Renders the task-inspector with a control to enter `taskId` into */
var TaskInspector = React.createClass({
  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      // Need updated clients for Queue and QueueEvents
      clients: {
        queue:                taskcluster.Queue,
        queueEvents:          taskcluster.QueueEvents
      },
      // Reload when state.taskId changes, ignore credential changes
      reloadOnKeys:           ['taskId'],
      reloadOnLogin:          false
    }),
    // Called handler when state.taskId changes
    utils.createWatchStateMixin({
      onKeys: {
        updateTaskIdInput:    ['taskId']
      }
    }),
    // Listen for messages, reload bindings() when state.taskId changes
    utils.createWebListenerMixin({
      reloadOnKeys:           ['taskId']
    }),
    // Serialize state.taskId to location.hash as string
    utils.createLocationHashMixin({
      keys:                   ['taskId'],
      type:                   'string'
    })
  ],

  getInitialState: function() {
    return {
      taskId:         '',
      statusLoaded:   true,
      statusError:    undefined,
      status:         null,
      taskIdInput:    ''
    };
  },

  /** Return promised state for TaskClusterMixin */
  load: function() {
    // Skip loading empty-strings
    if (this.state.taskId === '') {
      return {
        status:         null
      };
    }
    // Reload status structure
    return {
      // Load task status and take the `status` key from the response
      status:     this.queue.status(this.state.taskId)
                            .then(_.property('status'))
    };
  },

  /** Return bindings for WebListenerMixin */
  bindings: function() {
    // Don't bother listening for empty strings, they're pretty boring
    if (this.state.taskId === '') {
      return [];
    }
    // Construct the routing key pattern
    var routingKey = {
      taskId:     this.state.taskId
    };
    // Return all interesting bindings
    return [
      this.queueEvents.taskDefined(routingKey),
      this.queueEvents.taskPending(routingKey),
      this.queueEvents.taskRunning(routingKey),
      this.queueEvents.artifactCreated(routingKey),
      this.queueEvents.taskCompleted(routingKey),
      this.queueEvents.taskFailed(routingKey),
      this.queueEvents.taskException(routingKey)
    ];
  },

  /** Handle message from listener */
  handleMessage: function(message) {
    // Update status structure
    this.setState({
      status:           message.payload.status
    });

    // If the message origins from the artifact create exchange, we should
    // notify our children
    if (message.exchange === this.queueEvents.artifactCreated().exchange) {
      if (this.refs.taskView) {
        this.refs.taskView.handleArtifactCreatedMessage(message);
      }
    }
  },

  /** When taskId changed we should update the input */
  updateTaskIdInput: function() {
    this.setState({taskIdInput: this.state.taskId});
  },

  // Render a task-inspector
  render: function() {
    // Render
    var invalidInput = !/^[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]$/.test(this.state.taskIdInput);
    return (
      <span>
      <h1>Task Inspector</h1>
      <p>This tool lets you inspect a task given the <code>taskId</code></p>
      <form className="form-horizontal" onSubmit={this.handleSubmit}>
        <bs.Input
          type="text"
          ref="taskId"
          placeholder="taskId"
          value={this.state.taskIdInput}
          label={<span>Enter <code>TaskId</code></span>}
          bsStyle={invalidInput ? 'error' : null}
          onChange={this.handleTaskIdInputChange}
          hasFeedback
          labelClassName="col-sm-2"
          wrapperClassName="col-sm-10"/>
        <div className="form-group">
          <div className="col-sm-offset-2 col-sm-10">
            <input type="submit"
                   className="btn btn-primary"
                   disabled={!this.state.statusLoaded || invalidInput}
                   value="Inspect task"/>
          </div>
        </div>
      </form>
      {
        this.renderWaitFor('status') || (this.state.status ? (
          <TaskView
            ref="taskView"
            status={this.state.status}
            hashEntry={this.nextHashEntry()}/>
        ) : (
          undefined
        ))
      }
      </span>
    );
  },

  /** Update TaskIdInput to reflect input */
  handleTaskIdInputChange: function() {
    this.setState({
      taskIdInput:      this.refs.taskId.getInputDOMNode().value.trim()
    });
  },

  /** Handle form submission */
  handleSubmit: function(e) {
    e.preventDefault();
    this.setState({taskId: this.state.taskIdInput});
  }
});

// Export TaskInspector
module.exports = TaskInspector;
