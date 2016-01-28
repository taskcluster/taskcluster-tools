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
        {
          task.schedulerId === 'task-graph-scheduler' ? (
            <dd>
              <a href={'../task-graph-inspector/#' + task.taskGroupId}>
                {task.taskGroupId}
              </a>
            </dd>
          ) : (
            <dd><code>{task.taskGroupId}</code></dd>
          )
        }
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
        <dt>Edit in Task Creator</dt>
        <dd>
          <ConfirmAction buttonSize="xsmall"
                         buttonStyle="danger"
                         glyph="edit"
                         label="Edit Task"
                         action={this.editTask}
                         success="Opening Task Creator">
            Are you sure you wish to edit this task?
            Note that the edited task will not be linked to other tasks or
            have the same routes as other tasks, so this is not a way to "fix"
            a failing task in a larger task graph.  Note that you may also
            not have the scopes required to create the resulting task.
          </ConfirmAction>&nbsp;
        </dd>
      </dl>
      <dl className="dl-horizontal">
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
  editTask() {
    var newTask = {
      // filled in by task creator on load
      created: null,
      deadline: null,
    };
    // copy fields from the parent task, intentionally excluding some
    // fields which might cause confusion if left unchanged
    var exclude = [
        'routes',
        'taskGroupId',
        'schedulerId',
        'priority',
        'created',
        'deadline'
    ];
    _.keys(this.state.task).forEach(key => {
      if (!_.includes(exclude, key)) {
        newTask[key] = this.state.task[key];
      }
    });

    // overwrite task-creator's local state with this new task
    localStorage.setItem("task-creator/task", JSON.stringify(newTask));

    // ..and go there
    window.location.href = '../task-creator';
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
    var cmds = [];
    var imagePullCmds= [];
    var deviceCmds = [];

    if (!payload.image) {
      return "# Could not infer task payload format";
    }

    cmds.push("#!/bin/bash -e");
    cmds.push("# WARNING: this is experimental mileage may vary!");
    cmds.push("");

    if (typeof payload.image === 'string') {
      imagePullCmds.push("# Image appears to be a Docker Hub Image. Fetch docker image");
      imagePullCmds.push('image_name=' + payload.image);
      imagePullCmds.push("docker pull '" + payload.image + "'");
    } else if (typeof payload.image === 'object') {
      if (!payload.image.type || payload.image.type !== 'task-image') {
        return "# Failed to infer task payload format";
      }
      var imagePath = payload.image.path;
      var imageTaskId = payload.image.taskId;
      imagePullCmds.push("# Image appears to be a task image");
      imagePullCmds.push("# Download image tarball from task");
      imagePullCmds.push("curl -L -o image.tar https://queue.taskcluster.net/v1/task/" + imageTaskId + "/artifacts/" + imagePath);
      imagePullCmds.push("");
      imagePullCmds.push("# Extract image name and tag from image tarball");
      imagePullCmds.push("# Note: jq is required.  Download the package appropriate");
      imagePullCmds.push("# for your OS at https://stedolan.github.io/jq/");
      imagePullCmds.push("image=$(tar xf image.tar -O repositories | jq -r 'keys[0]')");
      imagePullCmds.push("image_tag=$(tar xf image.tar -O repositories | jq -r '.[keys[0]] | keys[0]')");
      imagePullCmds.push("image_name=$image:$image_tag");
      imagePullCmds.push("");
      imagePullCmds.push("# Load docker image from tarball");
      imagePullCmds.push("docker load < image.tar");
    } else {
      return "# Failed to infer task payload format";
    }

    imagePullCmds.forEach(function(cmd) { cmds.push(cmd); })

    // TODO Add devices other than loopback at some point
    if (payload.capabilities && payload.capabilities.devices) {
      cmds.push("");
      cmds.push("# Task uses the following devices :");
      cmds.push("# " + Object.keys(payload.capabilities.devices).join(', '));
      cmds.push("# Either use the docker vagrant environment located");
      cmds.push("# in the docker-worker repo or ensure local environment ");
      cmds.push("# has the correct devices configured.");
      cmds.push("# Consult the vagrant.sh file in the docker-worker repo ");
      cmds.push("# for more information on how to install and configure ");
      cmds.push("# the loopback devices. http://www.github.com/taskcluster/docker-worker");
      cmds.push("# Warning: This is entirely dependent on local setup and ");
      cmds.push("# availability of devices.");
      if (payload.capabilities.devices['loopbackVideo']) {
        deviceCmds.push("  --device /dev/video0:/dev/video0 \\");
      }
      if (payload.capabilities.devices['loopbackAudio']) {
        deviceCmds.push("  --device /dev/snd/controlC0:/dev/snd/controlC0 \\");
        deviceCmds.push("  --device /dev/snd/pcmC0D0c:/dev/snd/pcmC0D0c \\");
        deviceCmds.push("  --device /dev/snd/pcmC0D0p:/dev/snd/pcmC0D0p \\");
        deviceCmds.push("  --device /dev/snd/pcmC0D1c:/dev/snd/pcmC0D1c \\");
        deviceCmds.push("  --device /dev/snd/pcmC0D1p:/dev/snd/pcmC0D1p \\");
      }
    }

    cmds.push("");
    cmds.push("# Find a unique container name");
    cmds.push("container_name='task-" + taskId + "-container'");
    cmds.push("");
    cmds.push("# Run docker command");
    cmds.push("docker run -ti \\");
    cmds.push("  --name \"${container_name}\" \\");
    if (payload.capabilities && payload.capabilities.privileged) {
      cmds.push("  --privileged \\");
    }
    _.keys(payload.env || {}).forEach(key => {
      cmds.push("  -e " + key + "='" + payload.env[key] + "' \\");
    });
    deviceCmds.forEach(function (cmd) { cmds.push(cmd); });
    cmds.push("  ${image_name} \\");
    if (payload.command) {
      var command = payload.command.map(cmd => {
        cmd = cmd.replace(/\\/g, "\\\\");
        if (/['\n\r\t\v\b]/.test(cmd)) {
          return "'" + cmd.replace(/['\n\r\t\v\b]/g, c => {
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
    cmds.push("");
    if (payload.artifacts) {
      cmds.push("# Extract Artifacts");
      _.keys(payload.artifacts).forEach(name => {
        var src = payload.artifacts[name].path;
        var folder = name;
        if (payload.artifacts[name].type === 'file') {
          folder = path.dirname(name);
        }
        cmds.push("mkdir -p '" + folder + "'");
        cmds.push("docker cp \"${container_name}:" + src + "\" '" + name + "'");
      });
      cmds.push("");
    }
    cmds.push("# Delete docker container");
    cmds.push("docker rm -v \"${container_name}\"");
    return cmds.join('\n');
  }
});

// Export TaskInfo
module.exports = TaskInfo;
