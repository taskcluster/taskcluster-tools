let React             = require('react');
let _                 = require('lodash');
let bs                = require('react-bootstrap');
let format            = require('../format');
let path              = require('path');
let taskcluster       = require('taskcluster-client');
let utils             = require('../utils');

/** Displays information about a task in a tab page */
var TaskSummary = React.createClass({
  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      // Need updated clients for Queue
      clients: {
        queue:                taskcluster.Queue
      },
      // Reload when props.status.taskId changes, ignore credential changes
      reloadOnProps:          ['status.taskId'],
      reloadOnLogin:          false
    })
  ],

  // Validate properties
  propTypes: {
    status:   React.PropTypes.object.isRequired
  },

  /** Get initial state */
  getInitialState() {
    return {
      // task definition
      taskLoaded:         false,
      taskError:          undefined,
      task:               undefined
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
    var status  = this.props.status;
    var task    = this.state.task;

    var taskStateLabel = {
      unscheduled:      'label label-default',
      pending:          'label label-info',
      running:          'label label-primary',
      completed:        'label label-success',
      failed:           'label label-danger',
      exception:        'label label-warning'
    };

    var isResolved = [
      'completed',
      'failed',
      'exception'
    ].indexOf(status.state) !== -1;

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
          <a target="_blank" href={'../task-inspector/#' + status.taskId}>
            {status.taskId}
            &nbsp;
            <i className="fa fa-external-link"></i>
          </a>
        </dd>
      </dl>
      </div>
    );
  },

});

// Export TaskSummary
module.exports = TaskSummary;
