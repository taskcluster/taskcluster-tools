let React           = require('react');
let bs              = require('react-bootstrap');
let utils           = require('../../lib/utils');
let format          = require('../../lib/format');
let taskcluster     = require('taskcluster-client');
let _               = require('lodash');
let debug           = require('debug')('tools:one-click-loaner');

const taskStateLabel = {
  unscheduled:      'label label-default',
  pending:          'label label-info',
  running:          'label label-primary',
  completed:        'label label-success',
  failed:           'label label-danger',
  exception:        'label label-warning'
};

let Connect = React.createClass({
  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      // Need updated clients for Queue and QueueEvents
      clients: {
        queue:                taskcluster.Queue,
        queueEvents:          taskcluster.QueueEvents,
      },
      // Reload when state.taskId changes, ignore credential changes
      reloadOnKeys:           ['taskId'],
      reloadOnLogin:          false,
    }),
    // Listen for messages, reload bindings() when state.taskId changes
    utils.createWebListenerMixin({
      reloadOnKeys:           ['taskId'],
    }),
    // Serialize state.taskId to location.hash as string
    utils.createLocationHashMixin({
      keys:                   ['taskId'],
      type:                   'string',
    })
  ],

  getInitialState() {
    return {
      taskId:         '',
      statusLoaded:   true,
      statusError:    undefined,
      status:         null,
      shellUrl:       null,
      displayUrl:     null,
      taskLoaded:     true,
      taskError:      undefined,
      task:           null,
    };
  },

  load() {
    // Skip loading empty-strings
    if (this.state.taskId === '') {
      return {
        status:         null
      };
    }
    this.queue.listLatestArtifacts(this.state.taskId).then(result => {
      result.artifacts.forEach(a => this.processArtifact(a, false));
    }).catch(err => console.log("Failed to list artifacts: ", err));
    // Reload status structure
    return {
      // Load task status and take the `status` key from the response
      status: this.queue.status(this.state.taskId).then(_.property('status')),
      task:   this.queue.task(this.state.taskId),
    };
  },

  bindings() {
    // Don't bother listening for empty strings, they're pretty boring
    if (this.state.taskId === '') {
      return [];
    }
    // Construct the routing key pattern
    var routingKey = {
      taskId:     this.state.taskId
    };
    // Return all interesting bindings
    return [
      this.queueEvents.taskDefined(routingKey),
      this.queueEvents.taskPending(routingKey),
      this.queueEvents.taskRunning(routingKey),
      this.queueEvents.artifactCreated(routingKey),
      this.queueEvents.taskCompleted(routingKey),
      this.queueEvents.taskFailed(routingKey),
      this.queueEvents.taskException(routingKey)
    ];
  },

  handleMessage(message) {
    // Update status structure
    this.setState({
      status:           message.payload.status
    });

    // If the message origins from the artifact create exchange,
    // we should look for the shell.html artifact :)
    if (message.exchange === this.queueEvents.artifactCreated().exchange) {
      let name = message.payload.artifact.name;
      debug("Received artifact: %s", name);
      this.processArtifact(message.payload.artifact, true);
    }
  },

  processArtifact(artifact, notify) {
    let name = artifact.name;
    if (/shell\.html$/.test(name)) {
      this.setState({
        shellUrl: [
          this.queue.getLatestArtifact,
          this.state.taskId,
          name,
        ],
      });
      if (notify) {
        this.notify();
      }
    }
    if (/display\.html$/.test(name)) {
      this.setState({
        displayUrl: [
          this.queue.getLatestArtifact,
          this.state.taskId,
          name,
        ],
      });
      if (notify) {
        this.notify();
      }
    }
  },

  render() {
    if (this.state.taskId === '') {
      return <b>No <code>taskId</code> is specified.</b>
    }
    if (this.state.status && _.includes([
      'completed',
      'failed',
      'exception',
    ], this.state.status.state)) {
      return (
        <bs.Alert bsStyle="warning">
          <strong>
            Task Resolved!
          </strong>&nbsp;
          You can not attach to an interactive task after it has stopped running.
        </bs.Alert>
      );
    }

    if (this.state.shellUrl || this.state.displayUrl) {
      return (
        <span>
          <h1>Loaner Ready!</h1>
          <i>
            You have approximately 5 minutes to connect, after that the loaner
            will shutdown when all connections are closed.
          </i><br/><br/>
          <center>
          <b>Click to open a session, in a new tab</b><br/>
          <div onClick={this.openShell} className="connect-link-button">
            <span className="fa-stack">
              <i className="fa fa-square fa-stack-2x fa-fw"></i>
              <i className="fa fa-terminal fa-stack-1x fa-fw fa-inverse"></i>
            </span>
            <span className="connect-link-text">Shell</span>
          </div>
          <div onClick={this.openDisplay} className="connect-link-button">
            <span className="fa-stack">
              <i className="fa fa-square fa-stack-2x fa-fw"></i>
              <i className="fa fa-television fa-stack-1x fa-fw fa-inverse"></i>
            </span>
            <span className="connect-link-text">Display</span>
          </div>
          </center>
          <br/><br/>
          <bs.Alert bsStyle="info">
            <strong>
              This is not a development environment!
            </strong>&nbsp;
            Interactive tasks is a great way to quickly debug things, but you
            should be warned that many of these workers are spot-nodes that
            they may be terminated at any time.
          </bs.Alert>
          <h2>Task Information</h2>
          <hr/>
          {this.renderStatus()}
        </span>
      );
    }

    this.requestNotificationPermission();

    return (
      <span>
        <h1>Waiting for Loaner...</h1>
        <i>Waiting for interactive session to be ready.</i>
        <br/><br/>
        {this.renderStatus()}
      </span>
    );
  },

  renderStatus() {
    return this.renderWaitFor('status') || (this.state.status ? (
      <span>
      <dl className="dl-horizontal">
        <dt>taskId</dt>
        <dd>
          <code><a href={"/task-inspector#" + this.state.taskId}>
            {this.state.taskId}
          </a></code>
        </dd>
        <dt>Status</dt>
        <dd>
          <span className={taskStateLabel[this.state.status.state]}>
            {this.state.status.state}
          </span>
        </dd>
        {
          (this.state.task ? (
            <span>
            <dt>Name</dt>
            <dd>
              <format.Markdown>
                {this.state.task.metadata.name}
              </format.Markdown>
            </dd>
            <dt>Description</dt>
            <dd>
              <format.Markdown>
                {this.state.task.metadata.description}
              </format.Markdown>
            </dd>
            </span>
          ) : undefined)
        }
      </dl>
      </span>
    ) : undefined);
  },

  openShell() {
    let url = this.queue.buildSignedUrl(...this.state.shellUrl);
    window.open(url, '_blank');
  },

  openDisplay() {
    let url = this.queue.buildSignedUrl(...this.state.displayUrl);
    window.open(url, '_blank');
  },

  requestNotificationPermission() {
    if (window.Notification) {
      if (window.Notification.permission === 'default' &&
          !this._notificationPermissionRequest) {
        this._notificationPermissionRequest = true;
        window.Notification.requestPermission()
      }
    }
  },

  notify() {
    // Don't notify if we don't have permission or already did so
    if (window.Notification && window.Notification.permission === 'granted' &&
        !this._notified) {
      this._notified = true; // don't notify twice
      // Create notification
      let n = new window.Notification('TaskCluster - Loaner Ready!', {
        icon: '/one-click-loaner/connect/terminal.png',
        body: 'The one-click-loaner task: ' + this.state.taskId + ' that ' +
              'you have been waiting for is now ready. Connect now, ' +
              'if don\'t connect quickly the task will terminate.',
      });
      // Close notification after 30s (browser may close it sooner)
      setTimeout(() => n.close(), 30000);
      n.addEventListener('click', () => {
        n.close();
        window.focus();
      });
    }
  },
});

// Export Connect
module.exports = Connect;