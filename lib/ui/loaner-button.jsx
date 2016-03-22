let React           = require('react');
let taskcluster     = require('taskcluster-client');
let ConfirmAction   = require('./confirmaction');
let utils           = require('../utils');
let slugid          = require('slugid');
let _               = require('lodash');
let shellescape     = require('shell-escape');


let LoanerButton = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      // Need updated clients for Queue
      clients: {
        queue: taskcluster.Queue,
      },
    })
  ],

  propTypes: {
    taskId:         React.PropTypes.string.isRequired,
    task:           React.PropTypes.object.isRequired,
    buttonSize:     React.PropTypes.string.isRequired,
    buttonStyle:    React.PropTypes.string.isRequired,
    disabled:       React.PropTypes.bool,
  },

  getDefaultProps() {
    return {
      disabled: false,
    };
  },

  valid() {
    let payload = this.props.task.payload;
    if (!payload || !payload.image) {
      return false;
    }
    if (!(payload.command instanceof Array)) {
      return false;
    }
    if (typeof(payload.maxRunTime) !== 'number') {
      return false;
    }
    return true;
  },

  render() {
    return (
      <ConfirmAction glyph="console"
                     label="One-Click Loaner"
                     buttonSize={this.props.buttonSize}
                     buttonStyle={this.props.buttonStyle}
                     disabled={this.props.disabled || !this.valid()}
                     action={this.createTask}
                     success="Task created">
        This will duplicate the task and create it under a different
        <code>taskId</code>.<br/><br/>
        The new task will be altered as to:
        <ul>
          <li>Set <code>task.payload.features.interactive = true</code>,</li>
          <li>Strip <code>task.payload.caches</code> to avoid poisoning,</li>
          <li>Ensures <code>task.payload.maxRunTime</code> is minimum 60 minutes,</li>
          <li>Strip <code>task.routes</code> to avoid side-effects, and</li>
          <li>Set the environment variable<code>TASKCLUSTER_INTERACTIVE=true</code>.</li>
        </ul>
        Note: this may not work with all tasks.
      </ConfirmAction>
    );
  },

  async createTask() {
    let taskId = slugid.nice();
    let task = _.cloneDeep(this.props.task);

    // Strip routes
    delete task.routes;

    // Construct message of the day
    let msg = "\\nCreated by one-click-loaner based on taskId: " +
              this.props.taskId + "\\n" +
              "Original command was: " + shellescape(task.payload.command);

    task.payload.env = task.payload.env || {};
    task.payload.env.TASKCLUSTER_INTERACTIVE = 'true';

    // Strip artifacts
    delete task.payload.artifacts;

    // Strip dependencies and requires
    delete task.dependencies;
    delete task.requires;

    // Set interactive = true
    task.payload.features = task.payload.features || {};
    task.payload.features.interactive = true;

    // Strip caches
    delete task.payload.caches;

    // Update maxRunTime
    task.payload.maxRunTime = Math.max(
      task.payload.maxRunTime,
      3 * 60 * 60
    );

    // Update timestamps
    task.deadline = taskcluster.fromNowJSON('12 hours');
    task.created = taskcluster.fromNowJSON();
    task.expires = taskcluster.fromNowJSON('7 days');

    // Set task,retries to 0
    task.retries = 0;

    await this.queue.createTask(taskId, task);
    window.location = '/one-click-loaner/connect/#' + taskId;
  }
});

// Export LoanerButton
module.exports = LoanerButton;
