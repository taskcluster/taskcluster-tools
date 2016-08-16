let ConfirmAction     = require('./confirmaction');
let LoanerButton      = require('./loaner-button');
let PurgeCacheButton  = require('./purgecache-button');
let React             = require('react');
let RetriggerButton   = require('./retrigger-button');
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

    // var isResolved = [
    //   'completed',
    //   'failed',
    //   'exception'
    // ].indexOf(status.state) !== -1;

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
        <dt>Owner</dt>
        <dd><code>{task.metadata.owner}</code></dd>
        <dt>Source</dt>
        <dd>
          <a href={task.metadata.source}>
            {
              task.metadata.source.length > 90 ? (
                <span>...{task.metadata.source.substr(8 - 90)}</span>
              ) : (
                <span>{task.metadata.source}</span>
              )
            }
          </a>
        </dd>
      </dl>
      <dl className="dl-horizontal">
        <dt>State</dt>
        <dd>
          <span className={taskStateLabel[status.state]}>
            {status.state}
          </span>
        </dd>
        <dt>Retries Left</dt>
        <dd>{status.retriesLeft} of {task.retries}</dd>
      </dl>
      <dl className="dl-horizontal">
        <dt>Created</dt>
        <dd>
          <format.DateView date={task.created}/>
        </dd>
        <dt>Deadline</dt>
        <dd>
          <format.DateView date={task.deadline} since={task.created}/>
        </dd>
      </dl>
      <dl className="dl-horizontal">
        <dt>ProvisionerId</dt>
        <dd><code>{task.provisionerId}</code></dd>
        <dt>WorkerType</dt>
        <dd><code>{task.workerType}</code></dd>
      </dl>
      <dl className="dl-horizontal">
        <dt>SchedulerId</dt>
        <dd><code>{task.schedulerId}</code></dd>
        <dt>TaskGroupId</dt>
        <dd>
          <a href={'../task-group-inspector/#' + task.taskGroupId}>
            {task.taskGroupId}
          </a>
        </dd>
        <dt>Dependencies</dt>
        <dd>
          {
            task.dependencies.length > 0 ? (
              <ul>
                {
                  task.dependencies.map((dep, index) => {
                    return (
                      <li key={index}>
                        <a href={'../task-inspector/#' + dep}>{dep}</a>
                      </li>
                    );
                  })
                }
              </ul>
            ) : (
              '-'
            )
          }
        </dd>
        <dt>Requires</dt>
        <dd>
          This task will be scheduled when <i>dependencies</i> are
          {
            task.requires === 'all-completed' ?
              <span> <code>all-completed</code> successfully</span>
            :
              <span> <code>all-resolved</code> with any resolution</span>
          }
          .
        </dd>
      </dl>
      <dl className="dl-horizontal">
        <dt>Task Definition</dt>
        <dd>
          <a href={'https://queue.taskcluster.net/v1/task/' + status.taskId}
             target="_blank">
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
