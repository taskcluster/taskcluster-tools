import { PureComponent } from 'react';
import { Alert, Button, Label } from 'react-bootstrap';
import Tooltip from 'react-tooltip';
import { Link } from 'react-router-dom';
import Icon from 'react-fontawesome';
import { WebListener } from 'taskcluster-client-web';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import Markdown from '../../components/Markdown';
import HelmetTitle from '../../components/HelmetTitle';
import { labels } from '../../utils';
import iconUrl from './terminal.png';
import { connectLinkButton, connectLinkText } from './styles.module.css';
import UserSession from '../../auth/UserSession';

const notifyKey = 'interactive-notify';

export default class InteractiveConnect extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      status: null,
      shellUrl: null,
      displayUrl: null,
      task: null,
      notify:
        'Notification' in window && localStorage.getItem(notifyKey) === 'true'
    };
  }

  componentWillMount() {
    this.load(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (
      UserSession.userChanged(this.props.userSession, nextProps.userSession)
    ) {
      this.setState({ error: null });
    }

    if (nextProps.taskId !== this.props.taskId) {
      this.load(nextProps);
    }
  }

  componentWillUnmount() {
    if (this.taskListener) {
      this.taskListener.close();
      this.taskListener = null;
    }
  }

  async load({ queue, taskId }) {
    if (!taskId) {
      return this.setState({
        status: null,
        error: null
      });
    }

    if (!this.taskListener) {
      this.createTaskListener(taskId);
    }

    try {
      const [{ status }, task, { artifacts }] = await Promise.all([
        queue.status(taskId),
        queue.task(taskId),
        queue.listLatestArtifacts(taskId)
      ]);

      this.setState({
        status,
        task,
        error: null,
        ...this.getConnectionUrlState(queue, taskId, artifacts)
      });
    } catch (err) {
      this.setState({
        error: err,
        status: null,
        task: null
      });
    }
  }

  getConnectionUrlState(queue, taskId, artifacts) {
    return artifacts.reduce((state, { name }) => {
      if (name.endsWith('shell.html')) {
        return {
          ...state,
          shellUrl: [queue.getLatestArtifact, taskId, name]
        };
      } else if (name.endsWith('display.html')) {
        return {
          ...state,
          displayUrl: [queue.getLatestArtifact, taskId, name]
        };
      }

      return state;
    }, {});
  }

  createTaskListener(taskId) {
    if (this.taskListener) {
      this.taskListener.close();
      this.taskListener = null;
    }

    if (!taskId) {
      return;
    }

    const { queueEvents } = this.props;
    const listener = new WebListener();
    const routingKey = { taskId };

    [
      'taskDefined',
      'taskPending',
      'taskRunning',
      'artifactCreated',
      'taskCompleted',
      'taskFailed',
      'taskException'
    ].map(binding => listener.bind(queueEvents[binding](routingKey)));

    listener.on('message', this.handleTaskMessage);
    listener.on('reconnect', () => this.load(this.props));
    listener.connect();
    this.taskListener = listener;

    return listener;
  }

  handleTaskMessage = async ({ payload, exchange }) => {
    // Look for the shell.html artifact if the message originates from the artifact create exchange
    if (exchange === this.props.queueEvents.artifactCreated().exchange) {
      this.setState({
        status: payload.status,
        ...this.getConnectionUrlState(this.props.queue, this.props.taskId, [
          payload.artifact
        ])
      });
      this.notify();
    } else {
      this.setState({
        status: payload.status
      });
    }
  };

  handleRequestNotify = async () => {
    const notify = !this.state.notify;

    // If we are turning off notifications, or if the notification permission is already granted,
    // just change the notification state to the new value
    if (!notify || Notification.permission === 'granted') {
      localStorage.setItem(notifyKey, notify);

      return this.setState({ notify });
    }

    // Here we know the user is requesting to be notified, but has not yet granted permission
    const permission = await Notification.requestPermission();

    localStorage.setItem(notifyKey, permission === 'granted');
    this.setState({ notify: permission === 'granted' });
  };

  handleOpenShell = async () => {
    window.open(
      await this.props.queue.buildSignedUrl(...this.state.shellUrl),
      '_blank'
    );
  };

  handleOpenDisplay = async () => {
    window.open(
      await this.props.queue.buildSignedUrl(...this.state.displayUrl),
      '_blank'
    );
  };

  notify() {
    if (!this.state.notify) {
      return;
    }

    const notification = new Notification('Taskcluster', {
      icon: iconUrl,
      body:
        'Your interactive task is ready for connecting. Connect while the task is available.'
    });

    notification.addEventListener('click', () => {
      notification.close();
      window.focus();
    });

    this.setState({ notify: false });
    setTimeout(() => notification.close(), 30000);
  }

  renderStatus() {
    const { taskId } = this.props;
    const { status, task, notify } = this.state;

    return (
      <div>
        <dl className="dl-horizontal">
          <dt>Task ID</dt>
          <dd>
            <code>
              <Link to={`/tasks/${taskId}`}>{taskId}</Link>
            </code>
          </dd>

          <dt>Status</dt>
          <dd>
            <Label bsStyle={labels[status.state]}>{status.state}</Label>
          </dd>

          <div>
            <dt>Name</dt>
            <dd>
              <Markdown>{task.metadata.name}</Markdown>
            </dd>

            <dt>Description</dt>
            <dd>
              <Markdown>{task.metadata.description}</Markdown>
            </dd>
          </div>
        </dl>

        <Button
          bsSize="sm"
          bsStyle="primary"
          onClick={this.handleRequestNotify}
          disabled={
            !('Notification' in window) || Notification.permission === 'denied'
          }>
          <Icon name={notify ? 'check-square-o' : 'square-o'} />
          &nbsp;&nbsp;Notify me when ready
        </Button>
      </div>
    );
  }

  renderTask() {
    const { taskId } = this.props;
    const { status, task, error, shellUrl, displayUrl } = this.state;

    if (!taskId) {
      return (
        <Alert bsStyle="warning">
          No <code>taskId</code> was specified.
        </Alert>
      );
    }

    if (error) {
      return <Error error={error} />;
    }

    if (!status || !task) {
      return <Spinner />;
    }

    if (['completed', 'failed', 'exception'].includes(status.state)) {
      return (
        <Alert bsStyle="warning">
          <strong>
            <Link to={`/tasks/${taskId}`} data-tip data-for={taskId}>
              Task
            </Link>{' '}
            Resolved!
          </strong>
          You can not attach to an interactive task after it has stopped
          running.
          <Tooltip id={taskId} type="info" effect="float" place="top">
            {taskId}
          </Tooltip>
        </Alert>
      );
    }

    if (!shellUrl && !displayUrl) {
      return (
        <div>
          <em>Waiting for an interactive session to be ready.</em>
          <br />
          <br />
          {this.renderStatus()}
          <Spinner />
        </div>
      );
    }

    return (
      <div>
        <h5>Interactive Task Ready</h5>
        <em>
          You have approximately 5 minutes to connect, after that the task will
          shutdown when all connections are closed.
        </em>
        <br />
        <br />
        <div className="text-center">
          <strong>Select a session to open in a new tab:</strong>
          <br />

          <div
            onClick={this.handleOpenShell}
            className={connectLinkButton}
            style={{ marginRight: 20 }}>
            <span className="fa-stack fa-5x">
              <i className="fa fa-circle fa-stack-2x" />
              <i className="fa fa-terminal fa-stack-1x fa-inverse" />
            </span>
            <span className={connectLinkText}>Shell</span>
          </div>

          <div onClick={this.handleOpenDisplay} className={connectLinkButton}>
            <span className="fa-stack fa-5x">
              <i className="fa fa-circle fa-stack-2x" />
              <i className="fa fa-television fa-stack-1x fa-inverse" />
            </span>
            <span className={connectLinkText}>Display</span>
          </div>
        </div>
        <br />
        <br />

        <Alert bsStyle="info">
          <strong>This is not a development environment!</strong> Interactive
          tasks can help debug issues, but note that these workers may be spot
          nodes that can be terminated at any time.
        </Alert>

        <h5>Task Information</h5>
        <hr />
        {this.renderStatus()}
      </div>
    );
  }

  render() {
    return (
      <div>
        <HelmetTitle title="Interactive Connect" />
        <h4>Connect to Interactive Task</h4>
        <hr />
        {this.renderTask()}
      </div>
    );
  }
}
