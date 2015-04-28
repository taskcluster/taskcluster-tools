var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../../lib/utils');
var taskcluster     = require('taskcluster-client');
var _               = require('lodash');
var format          = require('../../lib/format');
var JSONInspector   = require('react-json-inspector');
var ArtifactList    = require('../../lib/ui/artifactlist');


var ArtifactView = React.createClass({
  mixins: [
    // Calls load()
    utils.createTaskClusterMixin({
      clients: {
        queue:          taskcluster.Queue
      },
      // Reload when props.taskId changes, ignore credentials changes
      reloadOnProps:          ['taskId'],
      reloadOnLogin:          false
    })
  ],

  getInitialState: function() {
    return {
      artifacts:        null,
      artifactsLoaded:  false,
      artifactsError:   undefined
    };
  },

  propTypes: {
    taskId:  React.PropTypes.string.isRequired
  },

  load: function() {
    return {
      artifacts:   this.queue.listLatestArtifacts(this.props.taskId)
    };
  },

  render: function() {
    return this.renderWaitFor('artifacts') || (
      <ArtifactList taskId={this.props.taskId}
                    artifacts={this.state.artifacts.artifacts}/>
    );
  }
});

var EntryView = React.createClass({
  mixins: [
    // Calls load()
    utils.createTaskClusterMixin({
      clients: {
        index:          taskcluster.Index
      },
      // Reload when props.namespace changes, ignore credentials changes
      reloadOnProps:          ['namespace'],
      reloadOnLogin:          false
    })
  ],

  propTypes: {
    namespace:  React.PropTypes.string.isRequired
  },

  getInitialState: function() {
    return {
      task:         null,
      taskError:    undefined,
      taskLoaded:   false
    };
  },

  load: function() {
    if (this.props.namespace === "") {
      return {
        task:       null,
        taskError:  undefined,
        taskLoaded: true
      }
    }
    return {
      task:   this.index.findTask(this.props.namespace)
    };
  },

  render: function() {
    return (
      <span>
      <h2>Artifacts from Indexed Task</h2>
      <hr/>
      {
        this.state.taskLoaded && this.state.taskError &&
        this.state.taskError.statusCode === 404 ? (
          <div className="alert alert-warning" role="alert">
            <strong>Task not found!</strong>&nbsp;
            No task is indexed under <code>{this.props.namespace}</code>.
          </div>
        ) : (
          this.renderWaitFor('task') || this.renderTask()
        )
      }
      </span>
    );
  },

  renderTask: function() {
    if (!this.state.task) {
      return undefined;
    }
    var inspectLink = [
      "https://tools.taskcluster.net",
      "/task-inspector/#",
      this.state.task.taskId,
      "/"
    ].join('');
    return (
      <span>
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
      </span>
    );
  }
});

// Export EntryView
module.exports = EntryView;
