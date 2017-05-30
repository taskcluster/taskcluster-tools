import React, { Component } from 'react';
import { Button, Table, Label } from 'react-bootstrap';
import _ from 'lodash';
import path from 'path';
import ConfirmAction from './confirmaction';
import LoanerButton from './loaner-button';
import { Markdown, DateView, Code } from '../format';
import './taskinfo.less';

/** Displays information about a task in a tab page */
class TaskInfo extends Component {
  constructor(props) {
    super(props);

    this.state = { showRunLocallyScript: false };

    this.editTask = this.editTask.bind(this);
    this.handleRunLocally = this.handleRunLocally.bind(this);
  }

  handleRunLocally() {
    this.setState({ showRunLocallyScript: !this.state.showRunLocallyScript });
  }

  render() {
    const { status, task } = this.props;
    const taskStateLabel = {
      unscheduled: 'default',
      pending: 'info',
      running: 'primary',
      completed: 'success',
      failed: 'danger',
      exception: 'warning'
    };

    return (
      <div>
        <Table>
          <tbody>
            <tr>
              <td>Name</td>
              <td><Markdown>{task.metadata.name}</Markdown></td>
            </tr>

            <tr>
              <td>Description</td>
              <td><Markdown>{task.metadata.description}</Markdown></td>
            </tr>

            <tr>
              <td>Owner</td>
              <td><code>{task.metadata.owner}</code></td>
            </tr>

            <tr>
              <td>Source</td>
              <td>
                <a href={task.metadata.source}>
                  {
                    task.metadata.source.length > 90 ? (
                      <span>...{task.metadata.source.substr(8 - 90)}</span>
                    ) : (
                      <span>{task.metadata.source}</span>
                    )
                  }
                </a>
              </td>
            </tr>

            <tr>
              <td>State</td>
              <td>
                <Label bsStyle={taskStateLabel[status.state]}>
                  {status.state}
                </Label>
              </td>
            </tr>

            <tr>
              <td>Retries Left</td>
              <td>{status.retriesLeft} of {task.retries}</td>
            </tr>

            <tr>
              <td>Created</td>
              <td><DateView date={task.created} /></td>
            </tr>

            <tr>
              <td>Deadline</td>
              <td><DateView date={task.deadline} since={task.created} /></td>
            </tr>

            <tr>
              <td>Provisioner</td>
              <td><code>{task.provisionerId}</code></td>
            </tr>

            <tr>
              <td>WorkerType</td>
              <td><code>{task.workerType}</code></td>
            </tr>

            <tr>
              <td>SchedulerId</td>
              <td><code>{task.schedulerId}</code></td>
            </tr>

            <tr>
              <td>TaskGroupId</td>
              <td>
                <a href={`/task-group-inspector/${task.taskGroupId}`}>{task.taskGroupId}</a>
              </td>
            </tr>

            <tr>
              <td>Dependencies</td>
              <td>
                {
                  task.dependencies.length ?
                    task.dependencies.map((dependency, key) => (
                      <div key={key}>
                        <a href={`/task-inspector/${dependency}`}>{dependency}</a>
                      </div>
                    )) :
                    '-'
                }
              </td>
            </tr>

            <tr>
              <td>Tags</td>
              <td>
                <table className="tag-table">
                  <tr>
                    <th>Tag</th>
                    <th>Value</th>
                  </tr>
                  {
                    Object
                      .entries(task.tags)
                      .map(([key, value]) => (
                        <tr key={key}>
                          <td>{key}</td>
                          <td>{value}</td>
                        </tr>
                      ))
                  }
                </table>
              </td>
            </tr>

            <tr>
              <td>Requires</td>
              <td>
                This task will be scheduled when <em>dependencies</em> are
                {
                  task.requires === 'all-completed' ? (
                    <span> <code>all-completed</code> successfully.</span>
                  ) : (
                    <span> <code>all-resolved</code> with any resolution.</span>
                  )
                }
              </td>
            </tr>

            <tr>
              <td>Scopes</td>
              <td>
                {
                  task.scopes.length ?
                    task.scopes.map((scope, key) => (
                      <div key={key}>
                        <code>{scope}</code>
                      </div>
                    )) :
                    '-'
                }
              </td>
            </tr>

            <tr>
              <td>Routes</td>
              <td>
                {
                  task.routes.length ?
                    task.routes.map((route, key) => (
                      <div key={key}>
                        <code>{route}</code>
                      </div>
                    )) :
                    '-'
                }
              </td>
            </tr>

            <tr>
              <td>Task Definition</td>
              <td>
                <a
                  href={`https://queue.taskcluster.net/v1/task/${status.taskId}`}
                  target="_blank"
                  rel="noopener noreferrer">
                  {status.taskId} <i className="fa fa-external-link" />
                </a>
              </td>
            </tr>

            <tr>
              <td>Payload</td>
              <td>
                <Code language="json">
                  {JSON.stringify(task.payload, null, 2)}
                </Code>
              </td>
            </tr>

            {Object.keys(task.extra).length > 0 && (
              <tr>
                <td>Extra</td>
                <td>
                  <Code language="json">
                    {JSON.stringify(task.extra, null, 2)}
                  </Code>
                </td>
              </tr>
            )}

            <tr>
              <td>Debug</td>
              <td>
                <ConfirmAction
                  buttonSize="small"
                  buttonStyle="default"
                  glyph="edit"
                  label="Edit and Re-create"
                  action={this.editTask}
                  success="Opening Task Creator">
                  Are you sure you wish to edit this task?<br />
                  Note that the edited task will not be linked to other tasks or
                  have the same <code>task.routes</code> as other tasks,
                  so this is not a way to "fix" a failing task in a larger task graph.
                  Note that you may also not have the scopes required to create the
                  resulting task.
                </ConfirmAction>&nbsp;
                <LoanerButton
                  task={this.props.task}
                  taskId={status.taskId}
                  buttonStyle="default"
                  buttonSize="small" />&nbsp;
                <Button type="submit" bsSize="small" bsStyle="default" onClick={this.handleRunLocally}>
                  Run Locally
                </Button>
              </td>
            </tr>
            {
              this.state.showRunLocallyScript && (
                <tr>
                  <td>Run Locally</td>
                  <td>
                    <Code language="bash">
                      {this.renderRunLocallyScript()}
                    </Code>
                  </td>
                </tr>
              )
            }
          </tbody>
        </Table>
      </div>
    );
  }

  editTask() {
    const newTask = {
      // filled in by task creator on load
      created: null,
      deadline: null
    };
    // copy fields from the parent task, intentionally excluding some
    // fields which might cause confusion if left unchanged
    const exclude = [
      'routes',
      'taskGroupId',
      'schedulerId',
      'priority',
      'created',
      'deadline',
      'dependencies',
      'requires'
    ];

    _.keys(this.props.task).forEach(key => {
      if (!_.includes(exclude, key)) {
        newTask[key] = this.props.task[key];
      }
    });

    // overwrite task-creator's local state with this new task
    localStorage.setItem('task-creator/task', JSON.stringify(newTask));

    // ..and go there
    window.location.href = '/task-creator';
  }

  /** Render script illustrating how to run locally */
  renderRunLocallyScript() {
    // Note:
    // We ignore cache folders, as they'll just be empty, which is fine.
    // TODO: Implement support for task.payload.features such as:
    //   - taskclusterProxy
    //   - testdroidProxy
    //   - balrogVPNProxy
    //   We can do this with --link and demonstrate how to inject
    //   credentials using environment variables
    //   (obviously we can provide the credentials)
    const taskId = this.props.status.taskId;
    const payload = this.props.task.payload;
    const cmds = [];
    const imagePullCmds = [];
    const deviceCmds = [];

    if (!payload.image) {
      return '# Could not infer task payload format';
    }

    cmds.push('#!/bin/bash -e');
    cmds.push('# WARNING: this is experimental mileage may vary!');
    cmds.push('');

    if (typeof payload.image === 'string') {
      imagePullCmds.push('# Image appears to be a Docker Hub Image. Fetch docker image');
      imagePullCmds.push(`image_name=${payload.image}`);
      imagePullCmds.push(`docker pull '${payload.image}'`);
    } else if (typeof payload.image === 'object') {
      if (!payload.image.type || payload.image.type !== 'task-image') {
        return '# Failed to infer task payload format';
      }

      const imagePath = payload.image.path;
      const imageTaskId = payload.image.taskId;
      const ext = path.extname(payload.image.path);

      imagePullCmds.push('# Image appears to be a task image');
      imagePullCmds.push('# Download image tarball from task');
      if (ext === '.zst') {
        imagePullCmds.push('# TODO: Install zstd > 1.0.0 from: https://github.com/facebook/zstd/releases');
        imagePullCmds.push(`curl -L https://queue.taskcluster.net/v1/task/${imageTaskId}/artifacts/${imagePath} | zstd -d > image.tar`);
      } else {
        imagePullCmds.push(`curl -L -o image.tar https://queue.taskcluster.net/v1/task/${imageTaskId}/artifacts/${imagePath}`);
      }
      imagePullCmds.push('');
      imagePullCmds.push('# Extract image name and tag from image tarball');
      imagePullCmds.push('# Note: jq is required.  Download the package appropriate');
      imagePullCmds.push('# for your OS at https://stedolan.github.io/jq/');
      imagePullCmds.push("image=$(tar xf image.tar -O repositories | jq -r 'keys[0]')");
      imagePullCmds.push("image_tag=$(tar xf image.tar -O repositories | jq -r '.[keys[0]] | keys[0]')");
      imagePullCmds.push('image_name=$image:$image_tag');
      imagePullCmds.push('');
      imagePullCmds.push('# Load docker image from tarball');
      imagePullCmds.push('docker load < image.tar');
    } else {
      return '# Failed to infer task payload format';
    }

    // TODO Add devices other than loopback at some point
    if (payload.capabilities && payload.capabilities.devices) {
      cmds.push('');
      cmds.push('# Task uses the following devices :');
      cmds.push(`# ${Object.keys(payload.capabilities.devices).join(', ')}`);
      cmds.push('');
      cmds.push('# Warning: This is entirely dependent on local setup and ');
      cmds.push('# availability of devices.');
      cmds.push('');
      if (payload.capabilities.devices.loopbackVideo) {
        cmds.push('# This job requires access to your video device.');
        cmds.push('');
        cmds.push('if [[ `apt-cache search v4l2loopback-dkms | wc -l` -eq 0 ]]; then');
        cmds.push(`  echo 'We are going to install v42loopback-dkms on your host.'`);
        cmds.push(`  echo 'If you are OK with it type your root password.'`);
        cmds.push('  sudo apt-get install -qq -f v4l2loopback-dkms');
        cmds.push('fi');
        cmds.push('');
        cmds.push('if [[ `lsmod | grep "v4l2loopback" | wc -l` -eq 0 ]]; then');
        cmds.push(`  echo 'We are going to create a video device under /dev/video*'`);
        cmds.push(`  echo 'This needs to happen every time after you reboot your machine.'`);
        cmds.push("  echo 'If you are OK with it type your root password.'");
        cmds.push('  sudo modprobe v4l2loopback');
        cmds.push('fi');
        cmds.push('');
        cmds.push('last_device=`ls /dev/video* | tail -n 1`');
        deviceCmds.push('  --device $last_device:$last_device \\');
      }
      if (payload.capabilities.devices.loopbackAudio) {
        cmds.push('# This job requires access to your audio device.');
        cmds.push('');
        cmds.push('# This command will create virtual devices under /dev/snd*');
        cmds.push('# sudo modprobe snd-aloop');
        cmds.push('');
        cmds.push('# Adjust the following list of --devices to match your host. Pick the most recently created ones.');
        deviceCmds.push('  --device /dev/snd/controlC0:/dev/snd/controlC0 \\');
        deviceCmds.push('  --device /dev/snd/pcmC0D0c:/dev/snd/pcmC0D0c \\');
        deviceCmds.push('  --device /dev/snd/pcmC0D0p:/dev/snd/pcmC0D0p \\');
        deviceCmds.push('  --device /dev/snd/pcmC0D1c:/dev/snd/pcmC0D1c \\');
        deviceCmds.push('  --device /dev/snd/pcmC0D1p:/dev/snd/pcmC0D1p \\');
      }
    }

    // The commands for video device initialization require some user interaction
    // Let's make sure we don't start downloading the image before user input might
    // be required to prevent the script execution to be halted half-way due to user
    // input being required.
    imagePullCmds.forEach(cmd => cmds.push(cmd));

    cmds.push('');
    cmds.push('# Find a unique container name');
    cmds.push(`container_name='task-${taskId}-container'`);
    cmds.push('');
    cmds.push('# Run docker command');
    cmds.push('docker run -ti \\');
    cmds.push('  --name "${container_name}" \\');

    if (payload.capabilities && payload.capabilities.privileged) {
      cmds.push('  --privileged \\');
    }

    _.keys(payload.env || {}).forEach(key => {
      cmds.push(`  -e ${key}='${payload.env[key]}' \\`);
    });

    // This allows changing behaviour on the script to be run to change
    // behaviour from production (e.g. start VNC)
    cmds.push(`  -e RUN_LOCALLY='true' \\`);

    deviceCmds.forEach(cmd => cmds.push(cmd));
    cmds.push('  ${image_name} \\');

    if (payload.command) {
      // We add a new line between 'docker run' and the command to ensure
      // that the container won't execute it and end since we want to allow
      // the developer to interact with it
      cmds.push('');

      const command = payload.command.map(_cmd => {
        const cmd = _cmd.replace(/\\/g, '\\\\');

        if (/['\n\r\t\v\b]/.test(cmd)) {
          const replaced = cmd.replace(/['\n\r\t\v\b]/g, c => ({
            "'": "\\'",
            '\n': '\\n',
            '\r': '\\r',
            '\t': '\\t',
            '\v': '\\v',
            '\b': '\\b'
          })[c]);

          return `'${replaced}'`;
        } else if (!/^[a-zA-Z0-9.,;:/_-]*$/.test(cmd)) {
          return `'${cmd}'`;
        }

        return cmd;
      }).join(' ');

      cmds.push(`  ${command} \\`);
    }

    cmds.push('');

    if (payload.artifacts) {
      cmds.push('# Extract Artifacts');
      _.keys(payload.artifacts).forEach(name => {
        const src = payload.artifacts[name].path;
        let folder = name;

        if (payload.artifacts[name].type === 'file') {
          folder = path.dirname(name);
        }

        cmds.push(`mkdir -p '${folder}'`);
        cmds.push(`docker cp "\${container_name}:${src}" '${name}'`);
      });

      cmds.push('');
    }

    cmds.push('# Delete docker container');
    cmds.push('docker rm -v "${container_name}"');

    return cmds.join('\n');
  }
}

TaskInfo.propTypes = {
  status: React.PropTypes.object.isRequired,
  task: React.PropTypes.object.isRequired
};

export default TaskInfo;
