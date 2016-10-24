import React from 'react';
import * as format from '../format';
import taskcluster from 'taskcluster-client';
import * as utils from '../utils';

/** Displays information about a task in a tab page */
const TaskSummary = React.createClass({
  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      // Need updated clients for Queue
      clients: {
        queue: taskcluster.Queue,
      },
      // Reload when props.status.taskId changes, ignore credential changes
      reloadOnProps: ['status.taskId'],
      reloadOnLogin: false,
    }),
  ],

  // Validate properties
  propTypes: {
    status: React.PropTypes.object.isRequired,
  },

  /** Get initial state */
  getInitialState() {
    return {
      // task definition
      taskLoaded: false,
      taskError: null,
      task: null,
    };
  },

  /** Load task definition */
  load() {
    return {
      task: this.queue.task(this.props.status.taskId),
    };
  },

  render() {
    // Easy references to values
    const {status} = this.props;
    const {task} = this.state;

    const taskStateLabel = {
      unscheduled: 'label label-default',
      pending: 'label label-info',
      running: 'label label-primary',
      completed: 'label label-success',
      failed: 'label label-danger',
      exception: 'label label-warning',
    };

    return this.renderWaitFor('task') || (
      <div>
        <dl className="dl-horizontal">
          <dt>Name</dt>
          <dd>
            <format.Markdown>
              {task.metadata.name}
            </format.Markdown>
          </dd>
          <dt>Description</dt>
          <dd>
            <format.Markdown>
              {task.metadata.description}
            </format.Markdown>
          </dd>
          <dt>State</dt>
          <dd>
            <span className={taskStateLabel[status.state]}>
              {status.state}
            </span>
          </dd>
          <dt>Task Inspector</dt>
          <dd>
            <a href={`../task-inspector/#${status.taskId}`} target="_blank" rel="noopener noreferrer">
              {status.taskId} <i className="fa fa-external-link" />
            </a>
          </dd>
        </dl>
      </div>
    );
  },
});

export default TaskSummary;
