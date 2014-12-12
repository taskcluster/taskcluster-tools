/** @jsx React.DOM */
var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../utils');
var format          = require('../format');
var _               = require('lodash');
var taskcluster     = require('taskcluster-client');


/** Displays information about a task in a tab page */
var TaskInfo = React.createClass({
  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      // Need updated clients for Queue
      clients: {
        queue:                taskcluster.Queue,
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
  getInitialState: function() {
    return {
      // task definition
      taskLoaded:   false,
      taskError:    undefined,
      task:         undefined
    };
  },

  /** Load task definition */
  load: function() {
    return {
      task:         this.queue.getTask(this.props.status.taskId)
    };
  },

  render: function() {
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

    return this.renderWaitFor('task') || (
      <span>
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
        <dd><code>{task.taskGroupId}</code></dd>
      </dl>
      <dl className="dl-horizontal">
        <dt>Scopes</dt>
        <dd>
          {
            task.scopes.length > 0 ? (
              <ul>
                {
                  task.scopes.map(function(scope, index) {
                    return <li key={index}><code>{scope}</code></li>;
                  })
                }
              </ul>
            ) : (
              '-'
            )
          }
        </dd>
        <dt>Routes</dt>
        <dd>
          {
            task.routes.length > 0 ? (
              <ul>
              {
                task.routes.map(function(route, index) {
                  return <li key={index}><code>{route}</code></li>
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
        <dt>Task Definition</dt>
        <dd>
          <a href={'https://queue.taskcluster.net/v1/task/' + status.taskId}
             target="_blank">
            {status.taskId}
            &nbsp;
            <i className="fa fa-external-link"></i>
          </a>
        </dd>
        <dt>Payload</dt>
        <dd>
          <format.Code language='json'>
            {JSON.stringify(task.payload, undefined, 2)}
          </format.Code>
        </dd>
      </dl>
      </span>
    );
  }
});

// Export TaskInfo
module.exports = TaskInfo;
