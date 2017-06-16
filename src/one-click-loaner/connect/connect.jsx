import React, { Component } from 'react';
import { Alert } from 'react-bootstrap';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import createDebugger from 'debug';
import { TaskClusterEnhance, CreateWebListener } from '../../lib/utils';
import * as format from '../../lib/format';
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

class Connect extends Component {
  constructor(props) {
    super(props);

    this.state = {
      taskId: this.props.match.params.taskId || '',
      statusLoaded: true,
      statusError: null,
      status: null,
      shellUrl: null,
      displayUrl: null,
      taskLoaded: true,
      taskError: null,
      task: null
    };

    this.openShell = this.openShell.bind(this);
    this.openDisplay = this.openDisplay.bind(this);
    this.load = this.load.bind(this);
    this.onListenerMessage = this.onListenerMessage.bind(this);
    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
    this.listening = this.listening.bind(this);
    this.bindings = this.bindings.bind(this);
  }

  componentWillMount() {
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.addEventListener('taskcluster-reload', this.load, false);
    document.addEventListener('listener-message', this.onListenerMessage, false);
    document.addEventListener('listener-listening', this.listening, false);

    this.load();
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.removeEventListener('taskcluster-reload', this.load, false);
    document.removeEventListener('listener-message', this.onListenerMessage, false);
    document.removeEventListener('listener-listening', this.listening, false);
  }

  onTaskClusterUpdate({ detail }) {
    if (detail.name !== this.constructor.name) {
      return;
    }

    this.setState(detail.state);
  }

  componentDidUpdate(prevProps, prevState) {
    // Send keys to higher order component
    this.props.taskclusterState(this.state, this.props);
    this.props.listenerState(this.state, this.props);
  }

  load(data) {
    if (typeof data === 'object' && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    // Skip loading empty-strings
    if (this.state.taskId === '') {
      return this.props.loadState({ status: null });
    }

    this.props.clients.queue
      .listLatestArtifacts(this.state.taskId)
      .then(result => {
        result.artifacts.forEach(a => this.processArtifact(a, false));
      });

    // Reload status structure
    const promisedState = {
      // Load task status and take the `status` key from the response
      status: this.props.clients.queue
        .status(this.state.taskId)
        .then(_.property('status')),
      task: this.props.clients.queue.task(this.state.taskId)
    };

    this.props.loadState(promisedState);
  }

  bindings() {
    // Don't bother listening for empty strings, they're pretty boring
    if (this.state.taskId === '') {
      return [];
    }

    // Construct the routing key pattern
    const routingKey = { taskId: this.state.taskId };

    // Return all interesting bindings
    return [
      this.props.clients.queueEvents.taskDefined(routingKey),
      this.props.clients.queueEvents.taskPending(routingKey),
      this.props.clients.queueEvents.taskRunning(routingKey),
      this.props.clients.queueEvents.artifactCreated(routingKey),
      this.props.clients.queueEvents.taskCompleted(routingKey),
      this.props.clients.queueEvents.taskFailed(routingKey),
      this.props.clients.queueEvents.taskException(routingKey)
    ];
  }

  listening() {
    this.props.clients.queue
      .listLatestArtifacts(this.state.taskId)
      .then(result => {
        result.artifacts.forEach(a => this.processArtifact(a, false));
      });
  }

  onListenerMessage({ detail }) {
    // Update status structure
    this.setState({ status: detail.payload.status });

    // If the message origins from the artifact create exchange,
    // we should look for the shell.html artifact :)
    if (detail.exchange === this.props.clients.queueEvents.artifactCreated().exchange) {
      const name = detail.payload.artifact.name;

      debug('Received artifact: %s', name);
      this.processArtifact(detail.payload.artifact, true);
    }
  }

  processArtifact(artifact, notify) {
    const name = artifact.name;

    if (/shell\.html$/.test(name)) {
      this.setState({
        shellUrl: [
          this.props.clients.queue.getLatestArtifact,
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
          this.props.clients.queue.getLatestArtifact,
          this.state.taskId,
          name
        ]
      });

      if (notify) {
        this.notify();
      }
    }
  }

  render() {
    if (this.state.taskId === '') {
      return (
        <div>
          <h4>Connect to Loaner</h4>
          <hr />
          <div className="alert alert-warning">No <code>taskId</code> was specified.</div>
        </div>
      );
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
          <br /><br />
          <div className="text-center">
            <strong>Click to open a session, in a new tab</strong>
            <br />

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
          <br /><br />

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
        <br /><br />
        {this.renderStatus()}
      </div>
    );
  }

  renderStatus() {
    return this.props.renderWaitFor('status') || (this.state.status ? (
      <div>
        <dl className="dl-horizontal">
          <dt>taskId</dt>
          <dd>
            <code><a href={`/task-inspector/${this.state.taskId}`}>{this.state.taskId}</a></code>
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
}

  openShell() {
    const url = this.props.clients.queue.buildSignedUrl(...this.state.shellUrl);

    window.open(url, '_blank');
  }

  openDisplay() {
    const url = this.props.clients.queue.buildSignedUrl(...this.state.displayUrl);

    window.open(url, '_blank');
  }

  requestNotificationPermission() {
    const shouldRequest = window.Notification &&
      window.Notification.permission === 'default' &&
      !this._notificationPermissionRequest;

    if (shouldRequest) {
      this._notificationPermissionRequest = true;
      window.Notification.requestPermission();
    }
  }

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
}

const taskclusterOpts = {
  // Need updated clients for Queue and QueueEvents
  clients: {
    queue: taskcluster.Queue,
    queueEvents: taskcluster.QueueEvents
  },
  // Reload when state.taskId changes, ignore credential changes
  reloadOnKeys: ['taskId'],
  reloadOnLogin: false,
  name: Connect.name
};

const webListenerOpts = {
  reloadOnKeys: ['taskId']
};

export default TaskClusterEnhance(CreateWebListener(Connect, webListenerOpts), taskclusterOpts);
