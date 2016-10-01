import React from 'react';
import * as utils from '../../lib/utils';
import taskcluster from 'taskcluster-client';
import ArtifactList from '../../lib/ui/artifactlist';

const ArtifactView = React.createClass({
  mixins: [
    // Calls load()
    utils.createTaskClusterMixin({
      clients: {
        queue: taskcluster.Queue
      },
      // Reload when props.taskId changes, ignore credentials changes
      reloadOnProps: ['taskId'],
      reloadOnLogin: false
    })
  ],

  getInitialState() {
    return {
      artifacts: null,
      artifactsLoaded: false,
      artifactsError: null
    };
  },

  propTypes: {
    taskId: React.PropTypes.string.isRequired
  },

  load() {
    return {
      artifacts: this.queue.listLatestArtifacts(this.props.taskId)
    };
  },

  render() {
    return this.renderWaitFor('artifacts') || (
      <ArtifactList
        taskId={this.props.taskId}
        artifacts={this.state.artifacts.artifacts} />
    );
  }
});

const EntryView = React.createClass({
  mixins: [
    // Calls load()
    utils.createTaskClusterMixin({
      clients: {
        index: taskcluster.Index
      },
      // Reload when props.namespace changes, ignore credentials changes
      reloadOnProps: ['namespace'],
      reloadOnLogin: false
    })
  ],

  propTypes: {
    namespace: React.PropTypes.string.isRequired
  },

  getInitialState() {
    return {
      task: null,
      taskError: null,
      taskLoaded: false
    };
  },

  load() {
    return this.props.namespace === '' ?
      { task: null, taskError: null, taskLoaded: true } :
      { task: this.index.findTask(this.props.namespace) };
  },

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
          this.renderWaitFor('task') || this.renderTask()
        }
      </div>
    );
  },

  renderTask() {
    if (!this.state.task) {
      return;
    }

    const inspectLink = `https://tools.taskcluster.net/task-inspector/#${this.state.task.taskId}/`;

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
            <ArtifactView taskId={this.state.task.taskId}/>
            <br/>
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
});

export default EntryView;
