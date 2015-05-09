var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../utils');
var format          = require('../format');
var _               = require('lodash');
var taskcluster     = require('taskcluster-client');
var ConfirmAction   = require('./confirmaction');
var path            = require('path');

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
  getInitialState() {
    return {
      // task definition
      taskLoaded:   false,
      taskError:    undefined,
      task:         undefined
    };
  },

  /** Load task definition */
  load() {
    return {
      task:         this.queue.task(this.props.status.taskId)
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
        <dt>Actions</dt>
        <dd>
          <ConfirmAction buttonSize="xsmall"
                         buttonStyle="primary"
                         disabled={status.state !== 'unscheduled'}
                         glyph="play"
                         label="Schedule Task"
                         action={this.scheduleTask}
                         success="Successfully scheduled task!">
            Are you wish to schedule the task?
            This will <b>overwrite any scheduling process</b> taking place,
            if this task is part of a continous integration process scheduling
            this task may cause your code to land with broken tests.
          </ConfirmAction>&nbsp;
          <ConfirmAction buttonSize="xsmall"
                         buttonStyle="success"
                         disabled={!isResolved}
                         glyph="repeat"
                         label="Rerun Task"
                         action={this.rerunTask}
                         success="Successfully scheduled task rerun!">
            Are you sure you wish to rerun this task?
            This will cause a new run of the task to be created. It will only
            succeed if the task hasn't passed it's deadline. Notice that this
            may interfere with listeners who only expects this tasks to be
            resolved once.
          </ConfirmAction>&nbsp;
          <ConfirmAction buttonSize="xsmall"
                         buttonStyle="danger"
                         disabled={isResolved}
                         glyph="stop"
                         label="Cancel Task"
                         action={this.cancelTask}
                         success="Successfully canceled task!">
            Are you sure you wish to cancel this task?
            Notice that another process or developer may still be able to
            schedule a rerun. But all existing runs will be aborted and any
            scheduling process will not be able to schedule the task.
          </ConfirmAction>&nbsp;
        </dd>
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
                  task.scopes.map((scope, index) => {
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
                task.routes.map((route, index) => {
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
        <dt>Run Locally</dt>
        <dd>
          <format.Code language='bash'>
            {this.renderRunLocallyScript()}
          </format.Code>
        </dd>
      </dl>
      </span>
    );
  },

  scheduleTask() {
    return this.queue.scheduleTask(this.props.status.taskId);
  },
  rerunTask() {
    return this.queue.rerunTask(this.props.status.taskId);
  },
  cancelTask() {
    return this.queue.cancelTask(this.props.status.taskId);
  },

  /** Render script illustrating how to run locally */
  renderRunLocallyScript() {
    // Note:
    // We ignore cache folders, as they'll just be empty, which is fine.
    // TODO: Implement support for task.payload.features such as:
    //        - taskclusterProxy
    //        - testdroidProxy
    //        - balrogVPNProxy
    //       We can do this with --link and demonstrate how to inject
    //       credentials using environment variables
    //       (obviously we can provide the credentials)
    var taskId  = this.props.status.taskId;
    var payload = this.state.task.payload;
    if (!payload.image) {
      return "# Failed to infer task payload format";
    }
    var cmds = [];
    cmds.push("#!/bin/bash");
    cmds.push("# WARNING: this is experimental mileage may vary!");
    cmds.push("");
    cmds.push("# Fetch docker image");
    cmds.push("docker pull " + payload.image);
    cmds.push("");
    cmds.push("# Find a unique container name");
    cmds.push("export $NAME='task-" + taskId + "-container';");
    cmds.push("");
    cmds.push("# Run docker command");
    cmds.push("docker run -ti \\");
    cmds.push("  --name $NAME \\");
    if (payload.capabilities && payload.capabilities.privileged) {
      cmds.push("  --privileged \\");
    }
    _.keys(payload.env || {}).forEach(key => {
      cmds.push("  -e " + key + "='" + payload.env[key] + "' \\");
    });
    cmds.push("  " + payload.image + " \\");
    if (payload.command) {
      var command = payload.command.map(cmd => {
        cmd = cmd.replace(/\\/g, "\\\\");
        if (/['\n\r\t\v\b]/.test(cmd)) {
          return "$'" + cmd.replace(/['\n\r\t\v\b]/g, c => {
            return {
              "'":  "\\'",
              "\n": "\\n",
              "\r": "\\r",
              "\t": "\\t",
              "\v": "\\v",
              "\b": "\\b"
            }[c];
          }) + "'";
        } else if (!/^[a-z-A-Z0-9\.,;://_-]*$/.test(cmd)) {
          return "'" + cmd + "'";
        }
        return cmd;
      }).join(' ');
      cmds.push("  " + command + " \\");
    }
    cmds.push("  ;");
    cmds.push("");
    if (payload.artifacts) {
      cmds.push("# Extract Artifacts");
      _.keys(payload.artifacts).forEach(name => {
        var src = payload.artifacts[name].path;
        var folder = name;
        if (payload.artifacts[name].type === 'file') {
          folder = path.dirname(name);
        }
        cmds.push("mkdir -p " + folder + ";");
        cmds.push("docker cp $NAME:" + src + " " + name + ";");
      });
    }
    cmds.push("");
    cmds.push("# Delete docker container");
    cmds.push("docker rm -v $NAME;");
    return cmds.join('\n');
  }
});

// Export TaskInfo
module.exports = TaskInfo;
