import React from 'react';
import { Redirect } from 'react-router-dom';
import { Helmet, title } from 'react-helmet';
import { Button, ButtonToolbar, Glyphicon, Col } from 'react-bootstrap';
import { safeLoad, safeDump } from 'js-yaml';
import merge from 'deepmerge';
import { nice } from 'slugid';
import Clients from '../../components/Clients';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import CodeEditor from '../../components/CodeEditor';

const localStorageKey = 'tasks:create';
const defaultTask = {
  provisionerId: 'aws-provisioner-v1',
  workerType: 'tutorial',
  created: null,
  deadline: null,
  payload: {
    image: 'ubuntu:13.10',
    command: ['/bin/bash', '-c', 'for ((i=1;i<=600;i++)); do echo $i; sleep 1; done'],
    maxRunTime: 60 * 10,
  },
  metadata: {
    name: 'Example Task',
    description: 'Markdown description of **what** this task does',
    owner: 'name@example.com',
    source: 'https://tools.taskcluster.net/task-creator/',
  },
};

class TaskCreator extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      task: null,
      createdTaskId: null,
      createdTaskError: null
    };
  }

  componentWillMount() {
    const task = this.getTask();

    try {
      this.setState({
        task: this.parameterizeTask(task),
        error: null
      });
    } catch (err) {
      this.setState({
        error: err,
        task: null
      });
    }
  }

  getTask() {
    const { location } = this.props;
    const { task } = this.state;

    if (task) {
      return task;
    }

    if (location.state && location.state.task) {
      return location.state.task;
    }

    try {
      return safeLoad(localStorage.getItem(localStorageKey)) || defaultTask;
    } catch (err) {
      return defaultTask;
    }
  }

  parameterizeTask(task) {
    const deadline = new Date();

    deadline.setMinutes(deadline.getMinutes() + 60);

    const clone = merge(task, {
      created: new Date().toJSON(),
      deadline: deadline.toJSON()
    });

    return `${safeDump(clone, { noCompatMode: true, noRefs: true })}`;
  }

  handleCreateTask = async () => {
    const { task } = this.state;
    const taskId = nice();
    const payload = safeLoad(task);

    try {
      await this.props.queue.createTask(taskId, payload);
      localStorage.setItem(localStorageKey, task);
      this.setState({ createdTaskId: taskId });
    } catch (err) {
      this.setState({ createdTaskError: err, createdTaskId: null });
    }
  };

  handleTaskChange = (value) => {
    try {
      safeLoad(value);
      this.setState({ invalid: false, task: value });
    } catch (err) {
      this.setState({ invalid: true });
    }
  };

  handleUpdateTimestamps = () => this.setState({ task: this.parameterizeTask(safeLoad(this.state.task)) });

  handleResetEditor = () => this.setState({ task: this.parameterizeTask(defaultTask) });

  renderState() {
    const { task, error } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (!task) {
      return <Spinner />;
    }

    return (
      <div>
        <CodeEditor mode="yaml" lint={true} value={task} onChange={this.handleTaskChange} />
        <br />

        <ButtonToolbar>
          <Button bsStyle="primary" onClick={this.handleCreateTask} disabled={this.state.invalid}>
            <Glyphicon glyph="ok" /> Create Task
          </Button>
          <Button bsStyle="info" onClick={this.handleUpdateTimestamps} disabled={this.state.invalid}>
            <Glyphicon glyph="repeat" /> Update Timestamps
          </Button>
          <Button bsStyle="danger" onClick={this.handleResetEditor}>
            <Glyphicon glyph="remove" /> Reset Editor
          </Button>
        </ButtonToolbar>
      </div>
    );
  }

  render() {
    const { createdTaskError, createdTaskId } = this.state;

    // If loaded, redirect to task inspector. We'll show errors later if there are errors.
    if (createdTaskId) {
      return <Redirect to={`/tasks/${createdTaskId}`} />;
    }

    return (
      <Col sm={12}>
        <Helmet>
          <title>{'Task Creator | TaskCluster'}</title>
        </Helmet>
        <h4>Task Creator</h4>
        <p>
          Write and submit a task to TaskCluster. For details on what you can write, refer to the&nbsp;
          <a href="https://docs.taskcluster.net" target="_blank" rel="noopener noreferrer">documentation</a>.
          When you submit a task here, you will be taken to the Task Inspector. Your task will be saved so you can
          come back and experiment with variations.
        </p>
        <hr />
        {createdTaskError && <Error error={createdTaskError} />}
        {this.renderState()}
      </Col>
    );
  }
}

export default props => (
  <Clients credentials={props.credentials} Queue>
    {({ queue }) => <TaskCreator queue={queue} history={props.history} location={props.location} />}
  </Clients>
);
