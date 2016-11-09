import React from 'react';
import taskcluster from 'taskcluster-client';
import ConfirmAction from './confirmaction';
import * as utils from '../utils';
import slugid from 'slugid';
import _ from 'lodash';
import {Button} from 'react-bootstrap';

const LoanerButton = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      // Need updated clients for Queue
      clients: {
        queue: taskcluster.Queue,
      },
    }),
  ],

  propTypes: {
    taskId: React.PropTypes.string.isRequired,
    task: React.PropTypes.object.isRequired,
    buttonSize: React.PropTypes.string.isRequired,
    buttonStyle: React.PropTypes.string.isRequired,
    disabled: React.PropTypes.bool,
  },

  getDefaultProps() {
    return {
      disabled: false,
    };
  },

  valid() {
    const payload = this.props.task.payload;

    if (!payload || !payload.image) {
      return false;
    }

    if (!Array.isArray(payload.command)) {
      return false;
    }

    return typeof payload.maxRunTime === 'number';
  },

  render() {
    // These items are buttons displayed inline-block, so wrapping in a span is correct
    return (
      <span>
        <ConfirmAction
          glyph="console"
          label="One-Click Loaner"
          buttonSize={this.props.buttonSize}
          buttonStyle={this.props.buttonStyle}
          disabled={this.props.disabled || !this.valid()}
          action={this.createTask}
          success="Task created">
          This will duplicate the task and create it under a different <code>taskId</code>.
          <br /><br />
          The new task will be altered as to:
          <ul>
            <li>Set <code>task.payload.features.interactive = true</code></li>
            <li>Strip <code>task.payload.caches</code> to avoid poisoning</li>
            <li>Ensures <code>task.payload.maxRunTime</code> is minimum 60 minutes</li>
            <li>Strip <code>task.routes</code> to avoid side-effects</li>
            <li>Set the environment variable<code>TASKCLUSTER_INTERACTIVE=true</code></li>
          </ul>
          Note: this may not work with all tasks.
        </ConfirmAction>&nbsp;
        <Button
          bsSize={this.props.buttonSize}
          bsStyle="default"
          disabled={this.props.disabled || !this.valid()}
          onClick={this.editTask}>
          Edit and Create Loaner Task
        </Button>
      </span>
    );
  },

  parameterizeTask() {
    const task = _.cloneDeep(this.props.task);

    // Strip taskGroupId and schedulerId
    delete task.taskGroupId;
    delete task.schedulerId;

    // Strip routes
    delete task.routes;

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
    delete task.payload.cache;

    // Delete cache scopes
    task.scopes = task.scopes.filter(scope => !/^docker-worker:cache:/.test(scope));

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

    return task;
  },

  async createTask() {
    const taskId = slugid.nice();
    const task = this.parameterizeTask();

    await this.queue.createTask(taskId, task);
    window.location = `/one-click-loaner/connect/#${taskId}`;
  },

  editTask() {
    const task = this.parameterizeTask();

    // overwrite task-creator's local state with this new task
    localStorage.setItem('task-creator/task', JSON.stringify(task));

    // ..and go there
    window.location.href = '/task-creator/';
  },
});

export default LoanerButton;
