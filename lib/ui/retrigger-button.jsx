let React           = require('react');
let taskcluster     = require('taskcluster-client');
let ConfirmAction   = require('./confirmaction');
let utils           = require('../utils');
let slugid          = require('slugid');
let _               = require('lodash');


let RetriggerButton = React.createClass({
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
      <ConfirmAction glyph="repeat"
                     label="Retrigger Task"
                     buttonSize={this.props.buttonSize}
                     buttonStyle={this.props.buttonStyle}
                     disabled={this.props.disabled || !this.valid()}
                     action={this.createTask}
                     success="Task created">
        This will duplicate the task and create it under a different
        <code>taskId</code>.<br/><br/>
        The new task will be altered as to:
        <ul>
          <li>Update deadlines and other timestamps for the current time.</li>
        </ul>
        Note: this may not work with all tasks.
      </ConfirmAction>
    );
  },

  async createTask() {
    let taskId = slugid.nice();
    let task = _.cloneDeep(this.props.task);

    let now = Date.now();
    let created = Date.parse(task.created);
    task.deadline = new Date(now + Date.parse(task.deadline) - created).toJSON();
    task.expires = new Date(now + Date.parse(task.expires) - created).toJSON();
    task.created = new Date(now).toJSON();

    task.retries = 0;

    await this.queue.createTask(taskId, task);
    window.location = '/task-inspector/#' + taskId;
  }
});

// Export RetriggerButton
module.exports = RetriggerButton;
