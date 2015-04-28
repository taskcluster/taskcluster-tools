var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var _               = require('lodash');
var format          = require('../lib/format');
var JSONInspector   = require('react-json-inspector');


var EntryView = React.createClass({
  mixins: [
    // Calls load()
    utils.createTaskClusterMixin({
      clients: {
        index:          taskcluster.Index
      },
      // Reload when props.namespace changes, ignore credentials changes
      reloadOnProps:           ['namespace'],
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
      <h2>Indexed Task</h2>
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
        <dt>Rank</dt>
        <dd>{this.state.task.rank}</dd>
        <dt>Expires</dt>
        <dd><format.DateView date={this.state.task.expires}/></dd>
        <dt>TaskId</dt>
        <dd><a href={inspectLink}>{this.state.task.taskId}</a></dd>
      </dl>
      <dl className="dl-horizontal">
        <dt>Data</dt>
        <dd>
          <JSONInspector data={this.state.task.data}/>
        </dd>
      </dl>
      </span>
    );
  }
});

// Export EntryView
module.exports = EntryView;
