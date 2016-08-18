const React             = require('react');
const _                 = require('lodash');
const bs                = require('react-bootstrap');
const format            = require('../format');
const path              = require('path');
const taskcluster       = require('taskcluster-client');
const utils             = require('../utils');

/** Displays information about a task in a tab page */
var TaskSummary = React.createClass({
  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      // Need updated clients for Queue
      clients: {
        queue: taskcluster.Queue
      },
      // Reload when props.status.taskId changes, ignore credential changes
      reloadOnProps: ['status.taskId'],
      reloadOnLogin: false
    })
  ],

  // Validate properties
  propTypes: {
    status: React.PropTypes.object.isRequired
  },

  /** Get initial state */
  getInitialState() {
    return {
      // task definition
      taskLoaded: false,
      taskError: null,
      task: null
    };
  },

  /** Load task definition */
  load() {
    return {
      task: this.queue.task(this.props.status.taskId)
    };
  },

  render() {
    // Easy references to values
    const { status } = this.props;
    const { task } = this.state;

    var taskStateLabel = {
      unscheduled: 'label label-default',
      pending: 'label label-info',
      running: 'label label-primary',
      completed: 'label label-success',
      failed: 'label label-danger',
      exception: 'label label-warning'
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
            <a target="_blank" href={`../task-inspector/#${status.taskId}`}>
              {status.taskId} <i className="fa fa-external-link" />
            </a>
          </dd>
        </dl>
      </div>
    );
  }
});

module.exports = TaskSummary;
