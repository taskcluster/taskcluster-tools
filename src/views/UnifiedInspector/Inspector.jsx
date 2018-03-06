import { PureComponent } from 'react';
import { Switch } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import { Row, Col, Nav, NavItem, Button } from 'react-bootstrap';
import Icon from 'react-fontawesome';
import { WebListener, request } from 'taskcluster-client-web';
import { isNil } from 'ramda';
import Helmet from 'react-helmet';
import PropsRoute from '../../components/PropsRoute';
import Error from '../../components/Error';
import SearchForm from './SearchForm';
import ActionsMenu from './ActionsMenu';
import RunsMenu from './RunsMenu';
import LogsMenu from './LogsMenu';
import ArtifactList from '../../components/ArtifactList';
import successFavIcon from '../../images/taskcluster-group-success.png';
import pendingFavIcon from '../../images/taskcluster-group-pending.png';
import failedFavIcon from '../../images/taskcluster-group-failed.png';
import { loadable } from '../../utils';
import iconUrl from '../../taskcluster.png';
import UserSession from '../../auth/UserSession';

const GroupProgress = loadable(() =>
  import(/* webpackChunkName: 'GroupProgress' */ './GroupProgress')
);
const GroupDetails = loadable(() =>
  import(/* webpackChunkName: 'GroupDetails' */ './GroupDetails')
);
const TaskDetails = loadable(() =>
  import(/* webpackChunkName: 'TaskDetails' */ './TaskDetails')
);
const RunDetails = loadable(() =>
  import(/* webpackChunkName: 'RunDetails' */ './RunDetails')
);
const LogView = loadable(() =>
  import(/* webpackChunkName: 'LogView' */ './LogView')
);
const taskGroupItemKey = 'inspector-items-taskGroupId';
const taskItemKey = 'inspector-items-taskId';
const notifyKey = 'inspector-notify';
const PATHS = {
  TASK_LIST: '/groups/:taskGroupId',
  TASK_DETAILS: '/groups/:taskGroupId/tasks/:taskId/details',
  RUN_DETAILS: '/groups/:taskGroupId/tasks/:taskId/runs/:run',
  LOG: '/groups/:taskGroupId/tasks/:taskId/runs/:run/logs/:artifactId',
  ARTIFACTS: '/groups/:taskGroupId/tasks/:taskId/runs/:run/artifacts'
};
const initialLogs = ['public/logs/terminal.log', 'public/logs/live.log'];

export default class Inspector extends PureComponent {
  static defaultProps = {
    taskGroupId: null,
    taskId: null
  };

  constructor(props) {
    super(props);
    this.state = {
      tasks: null,
      selectedTaskId: null,
      status: null,
      task: null,
      artifacts: null,
      selectedRun: null,
      notify:
        'Notification' in window && localStorage.getItem(notifyKey) === 'true',
      filterStatus: 'all',
      groupState: 'pending'
    };
  }

  componentWillMount() {
    if (this.props.taskGroupId) {
      this.loadTasks(this.props);
    }

    if (this.props.taskId) {
      this.loadTask(this.props);
    }
  }

  componentWillUnmount() {
    if (this.groupListener) {
      this.groupListener.close();
      this.groupListener = null;
    }

    if (this.taskListener) {
      this.taskListener.close();
      this.taskListener = null;
    }
  }

  async componentWillReceiveProps(nextProps) {
    const { taskGroupId, taskId, runId } = nextProps;
    const userChanged = UserSession.userChanged(
      this.props.userSession,
      nextProps.userSession
    );
    const error = userChanged ? null : this.state.error;

    if (taskGroupId !== this.props.taskGroupId) {
      this.setState({
        error,
        selectedTaskId: null,
        status: null,
        task: null,
        artifacts: null,
        selectedRun: null,
        tasks: null,
        actions: null,
        decision: null
      });

      if (taskGroupId) {
        this.loadTasks(nextProps);
      }
    } else if (
      taskId &&
      (taskId !== this.state.selectedTaskId ||
        (this.props.taskId && taskId !== this.props.taskId))
    ) {
      this.setState({
        error,
        selectedTaskId: taskId ? null : this.state.selectedTaskId,
        status: null,
        task: null,
        artifacts: null,
        selectedRun: null
      });

      this.loadTask(nextProps);
    } else if (Number.isInteger(runId) && runId !== this.props.runId) {
      this.setState({
        error,
        selectedRun: runId,
        artifacts:
          this.state.status.state !== 'unscheduled'
            ? await this.getArtifacts(this.props.taskId, runId)
            : []
      });
    }
  }

  async getActions(props) {
    const { queue, taskGroupId } = props;

    if (!taskGroupId) {
      return;
    }

    try {
      const [decision, actions] = await Promise.all([
        queue.task(taskGroupId),
        request(
          queue.buildUrl(
            queue.getLatestArtifact,
            taskGroupId,
            'public/actions.json'
          )
        )
      ]);

      return { decision, actions };
    } catch (err) {
      if (err.response && err.response.status !== 404) {
        throw err;
      }

      return { decision: null, actions: null };
    }
  }

  async loadTasks(props, token) {
    const { taskGroupId, queue } = props;

    if (!taskGroupId) {
      return;
    }

    if (!token) {
      this.updateLocalHistory(taskGroupId, taskGroupItemKey);

      if (!this.groupListener) {
        this.createGroupListener(taskGroupId);
      }
    }

    try {
      const [
        { decision, actions },
        { tasks, continuationToken }
      ] = await Promise.all([
        token ? Promise.resolve(this.state) : this.getActions(props),
        queue.listTaskGroup(
          taskGroupId,
          token ? { continuationToken: token, limit: 200 } : { limit: 20 }
        )
      ]);

      this.setState({
        actions,
        decision,
        tasks: tasks.reduce(
          (reduction, task) => {
            const index = reduction.findIndex(
              ({ status }) => status.taskId === task.status.taskId
            );

            if (index > -1) {
              reduction[index] = task; // eslint-disable-line no-param-reassign
            } else {
              reduction.push(task);
            }

            return reduction;
          },
          [...(this.state.tasks || [])]
        )
      });

      if (continuationToken) {
        this.loadTasks(props, continuationToken);
      }
    } catch (err) {
      this.setState({ error: err });
    }
  }

  async loadTask({ taskGroupId, taskId, history, sectionId, runId }) {
    if (!taskId || !taskGroupId) {
      return;
    }

    this.updateLocalHistory(taskId, taskItemKey);

    if (!this.taskListener) {
      this.createTaskListener(taskId);
    }

    try {
      const [status, task] = await Promise.all([
        this.getStatus(taskId),
        this.getTask(taskId)
      ]);
      const runNumber = this.getRunNumber(runId, null, status.runs);
      const artifacts =
        status.state !== 'unscheduled'
          ? await this.getArtifacts(taskId, runNumber)
          : [];

      this.setState({
        selectedTaskId: taskId,
        status,
        task,
        artifacts,
        selectedRun: runNumber
      });

      if (!sectionId) {
        const logs = this.getLogsFromArtifacts(artifacts);
        const log =
          logs.find(({ name }) => initialLogs.includes(name)) || logs[0];

        history.replace(
          log
            ? `/groups/${taskGroupId}/tasks/${taskId}/runs/${runNumber}/logs/${encodeURIComponent(
                log.name
              )}`
            : `/groups/${taskGroupId}/tasks/${taskId}/details`
        );
      }
    } catch (err) {
      this.setState({
        error: err,
        status: null,
        task: null,
        artifacts: null
      });
    }
  }

  createGroupListener(taskGroupId) {
    if (this.groupListener) {
      this.groupListener.close();
      this.groupListener = null;
    }

    if (!taskGroupId) {
      return;
    }

    const { queueEvents } = this.props;
    const listener = new WebListener();
    const routingKey = { taskGroupId };

    this.groupListener = listener;
    [
      'taskDefined',
      'taskPending',
      'taskRunning',
      'taskCompleted',
      'taskFailed',
      'taskException'
    ].map(binding => listener.bind(queueEvents[binding](routingKey)));
    listener.on('message', this.handleGroupMessage);
    listener.on('reconnect', () => this.loadTasks(this.props));
    listener.connect();

    return listener;
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

    this.taskListener = listener;
    listener.bind(queueEvents.artifactCreated(routingKey));
    listener.on('message', this.handleTaskMessage);
    listener.on('reconnect', () => this.loadTask(this.props));
    listener.connect();

    return listener;
  }

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

  handleTaskMessage = async ({ payload, exchange }) => {
    const { queueEvents, runId } = this.props;
    const { taskId } = payload.status;

    if (!taskId) {
      return;
    }

    if (exchange === queueEvents.artifactCreated().exchange) {
      const runNumber = this.getRunNumber(runId, null, payload.status.runs);
      const artifacts = await this.getArtifacts(taskId, runNumber);

      return this.setState({
        artifacts,
        status: payload.status
      });
    }
  };

  handleGroupMessage = async ({ payload, exchange }) => {
    const { queueEvents } = this.props;
    const { taskId } = payload.status;

    if (!taskId) {
      return this.setState({ status: payload.status });
    }

    const [status, task] = await Promise.all([
      this.getStatus(taskId),
      this.getTask(taskId)
    ]);
    const tasks =
      exchange === queueEvents.taskDefined().exchange
        ? [...this.state.tasks, { status, task }]
        : this.state.tasks.map(item => ({
            status: item.status.taskId === taskId ? status : item.status,
            task: item.status.taskId === taskId ? task : item.task
          }));

    this.setState(
      taskId === this.props.taskId ? { status, task, tasks } : { tasks },
      () => {
        if (exchange === queueEvents.taskException().exchange) {
          this.notify('A task exception occurred');
        } else if (exchange === queueEvents.taskFailed().exchange) {
          this.notify('A task failure occurred');
        }
      }
    );
  };

  handleGroupStateChange = groupState => {
    this.setState({ groupState });
  };

  navigate = (taskGroupId, taskId) => {
    const { history } = this.props;

    if (!taskGroupId && taskId) {
      history.push(`/tasks/${taskId}`);
    } else if (taskGroupId && !taskId) {
      history.push(`/groups/${taskGroupId}`);
    } else if (!taskGroupId && !taskId) {
      history.push('/groups');
    } else {
      history.push(`/groups/${taskGroupId}/tasks/${taskId}`);
    }
  };

  handleSearch = ({ taskGroupId, taskId }) => {
    if (
      taskId === this.props.taskId &&
      taskGroupId === this.props.taskGroupId
    ) {
      // Return if nothing has changed
      return;
    }

    if (
      taskId !== this.props.taskId &&
      taskGroupId !== this.props.taskGroupId
    ) {
      this.navigate(taskGroupId, taskId);
    } else if (taskGroupId !== this.props.taskGroupId) {
      this.navigate(taskGroupId);
    } else {
      const { tasks } = this.state;
      const task = tasks && tasks.find(task => task.status.taskId === taskId);

      if (task) {
        this.navigate(this.props.taskGroupId, taskId);
      } else {
        this.navigate(null, taskId);
      }
    }
  };

  handleHighlight = range => {
    if (this.highlightRange && this.highlightRange.equals(range)) {
      return;
    }

    const first = range.first();
    const last = range.last();

    if (!first) {
      this.props.history.replace({ hash: '' });
    } else if (first === last) {
      this.props.history.replace({ hash: `#L${first}` });
    } else {
      this.props.history.replace({ hash: `#L${first}-${last}` });
    }

    this.highlightRange = range;
  };

  getLocalHistory(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  async getStatus(taskId) {
    const { status } = await this.props.queue.status(taskId);

    return status;
  }

  getTask(taskId) {
    return this.props.queue.task(taskId);
  }

  async getArtifacts(taskId, runId) {
    const { artifacts } = await this.props.queue.listArtifacts(taskId, runId);

    return artifacts;
  }

  getLogsFromArtifacts(artifacts) {
    return artifacts.filter(({ name }) => /^public\/logs\//.test(name));
  }

  getFavicon() {
    switch (this.state.groupState) {
      case 'pending':
        return pendingFavIcon;
      case 'failed':
        return failedFavIcon;
      default:
        return successFavIcon;
    }
  }

  updateLocalHistory(id, localKey) {
    const ids = new Set(this.getLocalHistory(localKey).reverse());

    // If the id exists in the collection, remove it so we can push it to the end
    if (ids.has(id)) {
      ids.delete(id);
    }

    ids.add(id);

    // Keep the 5 most recent history items in the collection
    localStorage.setItem(
      localKey,
      JSON.stringify([...ids].slice(-5).reverse())
    );
  }

  handleEdit = task =>
    this.props.history.push({
      pathname: '/tasks/create',
      state: { task }
    });

  handleRetrigger = taskId => this.navigate(this.props.taskGroupId, taskId);

  handleActionTask = action => taskId => {
    switch (action) {
      case 'docker-worker-linux-loaner':
        this.props.history.push(`/tasks/${taskId}/connect`);
        break;
      case 'generic-worker-windows-loaner':
        this.props.history.push(`/tasks/${taskId}/connect`);
        break;
      default:
        this.navigate(this.props.taskGroupId, taskId);
    }
  };

  handleCreateInteractive = async taskId =>
    this.props.history.push(`/tasks/${taskId}/connect`);

  getRunNumber(runId, selectedRun, runs) {
    if (!isNil(runId)) {
      return runId;
    }

    if (!isNil(selectedRun)) {
      return selectedRun;
    }

    if (runs.length) {
      return runs.length - 1;
    }

    return 0;
  }

  notify(message) {
    if (!this.state.notify) {
      return;
    }

    return new Notification('Taskcluster', {
      icon: iconUrl,
      body: message
    });
  }

  handleFilterChange = filterStatus => this.setState({ filterStatus });

  renderTaskGroup() {
    const {
      taskGroupId,
      taskId,
      queue,
      purgeCache,
      url,
      runId,
      sectionId,
      subSectionId,
      artifactId,
      userSession
    } = this.props;
    const {
      tasks,
      actions,
      status,
      task,
      selectedTaskId,
      selectedRun,
      artifacts,
      decision
    } = this.state;
    const trackedTaskId = taskId || selectedTaskId;
    const runNumber = this.getRunNumber(
      runId,
      selectedRun,
      status ? status.runs : []
    );
    const logs = artifacts && this.getLogsFromArtifacts(artifacts);
    const selectedLog = logs && logs.find(({ name }) => name === artifactId);

    return (
      <div>
        <Row style={{ marginBottom: 40, marginTop: 40 }}>
          <GroupProgress
            onGroupStateChange={this.handleGroupStateChange}
            tasks={tasks}
          />
        </Row>

        <Row>
          <Nav bsStyle="tabs" activeHref={url} justified>
            <LinkContainer exact to={`/groups/${taskGroupId}`}>
              <NavItem>Task Group</NavItem>
            </LinkContainer>
            <LinkContainer
              to={`/groups/${taskGroupId}/tasks/${trackedTaskId}/details`}
              disabled={!trackedTaskId}>
              <NavItem>Task Details</NavItem>
            </LinkContainer>
            <ActionsMenu
              queue={queue}
              purgeCache={purgeCache}
              taskGroupId={taskGroupId}
              taskId={trackedTaskId}
              status={status}
              task={task}
              actions={actions}
              decision={decision}
              userSession={userSession}
              onActionTask={this.handleActionTask}
              onRetrigger={this.handleRetrigger}
              onEdit={this.handleEdit}
              onCreateInteractive={this.handleCreateInteractive}
              onEditInteractive={this.handleEdit}
            />
            <RunsMenu
              taskGroupId={taskGroupId}
              taskId={trackedTaskId}
              status={status}
              runId={runNumber}
              active={sectionId === 'runs' && !subSectionId}
            />
            <LogsMenu
              logs={logs}
              taskGroupId={taskGroupId}
              taskId={trackedTaskId}
              runId={runNumber}
              active={subSectionId === 'logs'}
            />
            <LinkContainer
              to={`/groups/${taskGroupId}/tasks/${trackedTaskId}/runs/${runNumber}/artifacts`}
              disabled={!(artifacts && artifacts.length)}
              active={subSectionId === 'artifacts'}>
              <NavItem>
                {artifacts && artifacts.length
                  ? 'Run Artifacts'
                  : 'No artifacts for run'}
              </NavItem>
            </LinkContainer>
          </Nav>
        </Row>

        <Row>
          <Switch>
            <PropsRoute
              path={PATHS.ARTIFACTS}
              component={ArtifactList}
              style={{ margin: 20 }}
              queue={queue}
              taskId={trackedTaskId}
              artifacts={artifacts}
              userSession={this.props.userSession}
              runId={runNumber}
            />
            <PropsRoute
              path={PATHS.LOG}
              component={LogView}
              queue={queue}
              taskId={trackedTaskId}
              runId={runId}
              status={status}
              log={selectedLog}
              highlight={this.props.highlight}
              onHighlight={this.handleHighlight}
            />
            <PropsRoute
              path={PATHS.RUN_DETAILS}
              component={RunDetails}
              task={task}
              run={status ? status.runs[runId] : null}
            />
            <PropsRoute
              path={PATHS.TASK_DETAILS}
              component={TaskDetails}
              queue={queue}
              status={status}
              task={task}
            />
            <PropsRoute
              path={PATHS.TASK_LIST}
              component={GroupDetails}
              onFilterChange={this.handleFilterChange}
              filterStatus={this.state.filterStatus}
              taskGroupId={taskGroupId}
              tasks={tasks}
            />
          </Switch>
        </Row>
      </div>
    );
  }

  render() {
    const { taskGroupId, taskId } = this.props;
    const { task, error, selectedTaskId, notify } = this.state;
    const trackedTaskId = taskId || selectedTaskId;
    const FavIcon = this.getFavicon();

    return (
      <div>
        <Helmet>
          <title>{`${task ? task.metadata.name : 'Task Inspector'}`}</title>
          <link rel="shortcut icon" type="image/png" href={FavIcon} />
        </Helmet>
        <h4>Task &amp; Group Inspector</h4>
        <Row>
          <Col xs={12}>
            <SearchForm
              onSearch={this.handleSearch}
              taskGroupId={taskGroupId}
              taskId={trackedTaskId}
              taskGroupHistory={this.getLocalHistory(taskGroupItemKey)}
              taskHistory={this.getLocalHistory(taskItemKey)}
            />
          </Col>
        </Row>

        {'Notification' in window ? (
          <Row>
            <Col xs={12}>
              <Button
                bsSize="sm"
                bsStyle="primary"
                onClick={this.handleRequestNotify}
                disabled={
                  !('Notification' in window) ||
                  Notification.permission === 'denied'
                }>
                <Icon name={notify ? 'check-square-o' : 'square-o'} />
                &nbsp;&nbsp;Notify me on task failures
              </Button>
            </Col>
          </Row>
        ) : null}

        {error && <Error error={error} />}
        {taskGroupId && this.renderTaskGroup()}
      </div>
    );
  }
}
