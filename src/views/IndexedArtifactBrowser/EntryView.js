import React from 'react';
import { string, object } from 'prop-types';
import { Link } from 'react-router-dom';
import Spinner from '../../components/Spinner';
import ArtifactView from './ArtifactView';

export default class EntryView extends React.PureComponent {
  static propTypes = {
    namespace: string.isRequired,
    namespaceTaskId: string,
    index: object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      task: null,
      fullNamespace: props.namespaceTaskId ?
        `${props.namespace}.${props.namespaceTaskId}` :
        props.namespace
    };
  }

  componentWillMount() {
    this.loadTask(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.namespace !== this.props.namespace || nextProps.namespaceTaskId !== this.props.namespaceTaskId) {
      this.loadTask(nextProps);
    }
  }

  async loadTask(props) {
    if (!props.namespace) {
      return this.setState({ error: null, task: {}, fullNamespace: null });
    }

    const fullNamespace = props.namespaceTaskId ?
      `${props.namespace}.${props.namespaceTaskId}` :
      props.namespace;

    try {
      this.setState({
        fullNamespace,
        error: null,
        task: await props.index.findTask(fullNamespace)
      });
    } catch (err) {
      this.setState({
        task: null,
        fullNamespace,
        error: err
      });
    }
  }

  renderTask() {
    const { fullNamespace, error, task } = this.state;

    if (error && error.statusCode === 404) {
      return (
        <div className="alert alert-warning" role="alert">
          <strong>Task not found!</strong>&nbsp;
          No task is indexed under <code>{fullNamespace}</code>.
        </div>
      );
    }

    if (!task) {
      return <Spinner />;
    }

    if (Object.keys(task).length === 0) {
      return null;
    }

    return (
      <div>
        <dl className="dl-horizontal">
          <dt>Namespace</dt>
          <dd><code>{task.namespace}</code></dd>
          <dt>Task ID</dt>
          <dd><Link to={`/tasks/${task.taskId}`}>{task.taskId}</Link></dd>
        </dl>

        <dl className="dl-horizontal">
          <dt>Latest Artifacts</dt>
          <dd>
            <ArtifactView taskId={task.taskId} namespace={task.namespace} queue={this.props.queue} />
            <br />
            <div className="alert alert-info" role="alert">
              <strong>Latest Artifacts</strong>&nbsp;
              is the artifacts from the last run of the task.
              View the task in the <Link to={`/tasks/${task.taskId}`}>Task &amp; Group Inspector</Link> to
              discover artifacts from other runs.
            </div>
          </dd>
        </dl>
      </div>
    );
  }

  render() {
    return (
      <div>
        <h4>Artifacts from Indexed Task</h4>
        <hr />
        {this.renderTask()}
      </div>
    );
  }
}
