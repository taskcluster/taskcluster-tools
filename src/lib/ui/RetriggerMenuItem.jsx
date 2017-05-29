import React, {Component} from 'react';
import taskcluster from 'taskcluster-client';
import ConfirmActionMenuItem from './ConfirmActionMenuItem';
import {TaskClusterEnhance} from '../utils';
import slugid from 'slugid';
import _ from 'lodash';

class RetriggerMenuItem extends Component {
  constructor(props) {
    super(props);

    this.createTask = this.createTask.bind(this);
  }

  valid() {
    // Simple sanity check
    return !!(this.props.task && this.props.task.payload);
  }

  render() {
    return (
      <ConfirmActionMenuItem
        glyph="repeat"
        label="Retrigger Task"
        disabled={this.props.disabled || !this.valid()}
        action={this.createTask}
        success="Task created">
        This will duplicate the task and create it under a different <code>taskId</code>.
        <br /><br />
        The new task will be altered to:
        <ul>
          <li>Update deadlines and other timestamps for the current time</li>
          <li>Strip self-dependencies from the task definition</li>
        </ul>
        Note: this may not work with all tasks.
      </ConfirmActionMenuItem>
    );
  }

  async createTask() {
    const taskId = slugid.nice();
    const task = _.cloneDeep(this.props.task);

    const now = Date.now();
    const created = Date.parse(task.created);

    task.deadline = new Date(now + Date.parse(task.deadline) - created).toJSON();
    task.expires = new Date(now + Date.parse(task.expires) - created).toJSON();
    task.created = new Date(now).toJSON();
    task.dependencies = task.dependencies.filter(requiredTask => requiredTask !== taskId);
    task.retries = 0;

    await this.props.clients.queue.createTask(taskId, task);
    window.location = `/task-inspector/${taskId}`;
  }
}

RetriggerMenuItem.defaultProps = {disabled: false};

RetriggerMenuItem.propTypes = {
  taskId: React.PropTypes.string.isRequired,
  task: React.PropTypes.object.isRequired,
  disabled: React.PropTypes.bool
};

const taskclusterOpts = {
  // Need updated clients for Queue
  clients: {
    queue: taskcluster.Queue,
  },
  name: RetriggerMenuItem.name
};

export default TaskClusterEnhance(RetriggerMenuItem, taskclusterOpts);
