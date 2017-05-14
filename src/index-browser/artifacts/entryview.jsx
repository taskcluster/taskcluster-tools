import React, {Component} from 'react';
import {TaskClusterEnhance} from '../../lib/utils';
import taskcluster from 'taskcluster-client';
import ArtifactList from '../../lib/ui/artifactlist';

class ArtifactView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      artifacts: null,
      artifactsLoaded: false,
      artifactsError: null
    };

    this.load = this.load.bind(this);
    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
  }

  componentWillMount() {
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.addEventListener('taskcluster-reload', this.load, false);

    this.load();
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.removeEventListener('taskcluster-reload', this.load, false);
  }

  /** Update values for reloadOnProps and reloadOnKeys */
  componentDidUpdate(prevProps, prevState) {
    this.props.taskclusterState(this.state, this.props);
  }

  onTaskClusterUpdate({detail}) {
    this.setState(detail);
  }

  load(data) {
    if (data && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    const promisedState = {artifacts: this.props.clients.queue.listLatestArtifacts(this.props.taskId)};

    this.props.loadState(promisedState);
  }

  render() {
    return this.props.renderWaitFor('artifacts') || (
        <ArtifactList
          taskId={this.props.taskId}
          indexNamespace={this.props.indexNamespace}
          artifacts={this.state.artifacts ? this.state.artifacts.artifacts : []} />
      );
  }
}

ArtifactView.propTypes = {
  taskId: React.PropTypes.string.isRequired,
  indexNamespace: React.PropTypes.string.isRequired
};

const artifactViewTaskclusterOpts = {
  clients: {
    queue: taskcluster.Queue
  },
  // Reload when props.taskId changes, ignore credentials changes
  reloadOnProps: ['taskId', 'indexNamespace'],
  reloadOnLogin: false,
  name: ArtifactView.name
};

const ArtifactViewEnhanced = TaskClusterEnhance(ArtifactView, artifactViewTaskclusterOpts);

class EntryView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      task: null,
      taskError: null,
      taskLoaded: false
    };

    this.load = this.load.bind(this);
    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
  }

  componentWillMount() {
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.addEventListener('taskcluster-reload', this.load, false);

    this.load();
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.removeEventListener('taskcluster-reload', this.load, false);
  }

  /** Update values for reloadOnProps and reloadOnKeys */
  componentDidUpdate(prevProps, prevState) {
    this.props.taskclusterState(this.state, this.props);
  }

  onTaskClusterUpdate({detail}) {
    this.setState(detail);
  }

  load(data) {
    if (data && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    const promisedState = this.props.namespace === '' ?
      {task: null, taskError: null, taskLoaded: true} :
      {task: this.props.clients.index.findTask(this.props.namespace)};

    this.props.loadState(promisedState);
  }

  render() {
    return (
      <div>
        <h4>Artifacts from Indexed Task</h4>
        <hr />
        {
          this.state.taskLoaded && this.state.taskError &&
          this.state.taskError.statusCode === 404 ? (
            <div className="alert alert-warning" role="alert">
              <strong>Task not found!</strong>&nbsp;
              No task is indexed under <code>{this.props.namespace}</code>.
            </div>
          ) :
          this.props.renderWaitFor('task') || this.renderTask()
        }
      </div>
    );
  }

  renderTask() {
    if (!this.state.task) {
      return;
    }

    const inspectLink = `https://tools.taskcluster.net/task-inspector/${this.state.task.taskId}/`;

    return (
      <div>
        <dl className="dl-horizontal">
          <dt>Namespace</dt>
          <dd><code>{this.state.task.namespace}</code></dd>
          <dt>TaskId</dt>
          <dd><a href={inspectLink}>{this.state.task.taskId}</a></dd>
        </dl>

        <dl className="dl-horizontal">
          <dt>Latest Artifacts</dt>
          <dd>
            <ArtifactViewEnhanced taskId={this.state.task.taskId} indexNamespace={this.state.task.namespace} />
            <br />
            <div className="alert alert-info" role="alert">
              <strong>Latest Artifacts</strong>&nbsp;
              is the artifacts from the last run of the task.
              View the task in the <a href={inspectLink}>task-inspector</a> to
              discover artifacts from other runs.
            </div>
          </dd>
        </dl>
      </div>
    );
  }
}

EntryView.propTypes = {namespace: React.PropTypes.string.isRequired};

const entryViewTaskclusterOpts = {
  clients: {
    index: taskcluster.Index
  },
  // Reload when props.namespace changes, ignore credentials changes
  reloadOnProps: ['namespace'],
  reloadOnLogin: false,
  name: EntryView.name
};

export default TaskClusterEnhance(EntryView, entryViewTaskclusterOpts);
