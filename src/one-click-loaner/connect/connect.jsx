import React from 'react';
import { Alert } from 'react-bootstrap';
import * as utils from '../../lib/utils';
import * as format from '../../lib/format';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import createDebugger from 'debug';
import './connect.less';

const debug = createDebugger('tools:one-click-loaner');
const taskStateLabel = {
  unscheduled: 'label label-default',
  pending: 'label label-info',
  running: 'label label-primary',
  completed: 'label label-success',
  failed: 'label label-danger',
  exception: 'label label-warning'
};

export default React.createClass({
  displayName: 'Connect',

  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      // Need updated clients for Queue and QueueEvents
      clients: {
        queue: taskcluster.Queue,
        queueEvents: taskcluster.QueueEvents
      },
      // Reload when state.taskId changes, ignore credential changes
      reloadOnKeys: ['taskId'],
      reloadOnLogin: false
    }),
    // Listen for messages, reload bindings() when state.taskId changes
    utils.createWebListenerMixin({
      reloadOnKeys: ['taskId']
    }),
    // Serialize state.taskId to location.hash as string
    utils.createLocationHashMixin({
      keys: ['taskId'],
      type: 'string'
    })
  ],

  getInitialState() {
    return {
      taskId: '',
      statusLoaded: true,
      statusError: null,
      status: null,
      shellUrl: null,
      displayUrl: null,
      taskLoaded: true,
      taskError: null,
      task: null
    };
  },

  load() {
    // Skip loading empty-strings
    if (this.state.taskId === '') {
      return {
        status: null
      };
    }

    this.queue
      .listLatestArtifacts(this.state.taskId)
      .then(result => {
        result.artifacts.forEach(a => this.processArtifact(a, false));
      })
      .catch(err => console.log('Failed to list artifacts: ', err));

    // Reload status structure
    return {
      // Load task status and take the `status` key from the response
      status: this.queue
        .status(this.state.taskId)
        .then(_.property('status')),
      task: this.queue.task(this.state.taskId)
    };
  },

  bindings() {
    // Don't bother listening for empty strings, they're pretty boring
    if (this.state.taskId === '') {
      return [];
    }

    // Construct the routing key pattern
    const routingKey = {
      taskId: this.state.taskId
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

  listening() {
    this.queue
      .listLatestArtifacts(this.state.taskId)
      .then(result => {
        result.artifacts.forEach(a => this.processArtifact(a, false));
      })
      .catch(err => console.log('Failed to list artifacts: ', err));
  },

  handleMessage(message) {
    // Update status structure
    this.setState({
      status: message.payload.status
    });

    // If the message origins from the artifact create exchange,
    // we should look for the shell.html artifact :)
    if (message.exchange === this.queueEvents.artifactCreated().exchange) {
      const name = message.payload.artifact.name;

      debug('Received artifact: %s', name);
      this.processArtifact(message.payload.artifact, true);
    }
  },

  processArtifact(artifact, notify) {
    const name = artifact.name;

    if (/shell\.html$/.test(name)) {
      this.setState({
        shellUrl: [
          this.queue.getLatestArtifact,
          this.state.taskId,
          name
        ]
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
          name
        ]
      });

      if (notify) {
        this.notify();
      }
    }
  },

  render() {
    if (this.state.taskId === '') {
      return <strong>No <code>taskId</code> is specified.</strong>;
    }

    const includesState = this.state.status &&
      _.includes(['completed', 'failed', 'exception'], this.state.status.state);

    if (includesState) {
      return (
        <Alert bsStyle="warning">
          <strong>Task Resolved!</strong> You can not attach to an interactive task after it has
          stopped running.
        </Alert>
      );
    }

    if (this.state.shellUrl || this.state.displayUrl) {
      return (
        <div>
          <h1>Loaner Ready!</h1>
          <em>
            You have approximately 5 minutes to connect, after that the loaner
            will shutdown when all connections are closed.
          </em>
          <br/><br/>
          <div className="text-center">
            <strong>Click to open a session, in a new tab</strong>
            <br/>

            <div onClick={this.openShell} className="connect-link-button">
              <span className="fa-stack">
                <i className="fa fa-square fa-stack-2x fa-fw" />
                <i className="fa fa-terminal fa-stack-1x fa-fw fa-inverse" />
              </span>
              <span className="connect-link-text">Shell</span>
            </div>

            <div onClick={this.openDisplay} className="connect-link-button">
              <span className="fa-stack">
                <i className="fa fa-square fa-stack-2x fa-fw" />
                <i className="fa fa-television fa-stack-1x fa-fw fa-inverse" />
              </span>
              <span className="connect-link-text">Display</span>
            </div>
          </div>
          <br/><br/>

          <Alert bsStyle="info">
            <strong>This is not a development environment!</strong> Interactive tasks are a great
            way to quickly debug things, but you should be warned that many of these workers are
            spot-nodes that they may be terminated at any time.
          </Alert>

          <h2>Task Information</h2>
          <hr />
          {this.renderStatus()}
        </div>
      );
    }

    this.requestNotificationPermission();

    return (
      <div>
        <h1>Waiting for Loaner...</h1>
        <em>Waiting for interactive session to be ready.</em>
        <br/><br/>
        {this.renderStatus()}
      </div>
    );
  },

  renderStatus() {
    return this.renderWaitFor('status') || (this.state.status ? (
      <div>
        <dl className="dl-horizontal">
          <dt>taskId</dt>
          <dd>
            <code><a href={`/task-inspector#${this.state.taskId}`}>{this.state.taskId}</a></code>
          </dd>
          <dt>Status</dt>
          <dd>
            <span className={taskStateLabel[this.state.status.state]}>
              {this.state.status.state}
            </span>
          </dd>
          {
            this.state.task ? (
              <div>
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
              </div>
            ) :
            null
          }
        </dl>
      </div>
    ) :
    null);
  },

  openShell() {
    const url = this.queue.buildSignedUrl(...this.state.shellUrl);
    window.open(url, '_blank');
  },

  openDisplay() {
    const url = this.queue.buildSignedUrl(...this.state.displayUrl);
    window.open(url, '_blank');
  },

  requestNotificationPermission() {
    const shouldRequest = window.Notification &&
      window.Notification.permission === 'default' &&
      !this._notificationPermissionRequest;

    if (shouldRequest) {
      this._notificationPermissionRequest = true;
      window.Notification.requestPermission();
    }
  },

  notify() {
    // Don't notify if we don't have permission or already did so
    const hasPermission = window.Notification &&
      window.Notification.permission === 'granted' &&
      !this._notified;

    if (hasPermission) {
      this._notified = true; // don't notify twice
      // Create notification
      const notification = new window.Notification('TaskCluster - Loaner Ready!', {
        icon: '/one-click-loaner/connect/terminal.png',
        body: `The one-click-loaner task: ${this.state.taskId} that you have been waiting for is
          now ready. Connect now, if don't connect quickly the task will terminate.`
      });

      // Close notification after 30s (browser may close it sooner)
      setTimeout(() => notification.close(), 30000);
      notification.addEventListener('click', () => {
        notification.close();
        window.focus();
      });
    }
  }
});
