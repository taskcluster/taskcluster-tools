import React from 'react';
import * as utils from '../lib/utils';
import taskcluster from 'taskcluster-client';
import * as format from '../lib/format';
import JSONInspector from 'react-json-inspector';
import './entryview.less';

export default React.createClass({
  displayName: 'EntryView',

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
    if (this.props.namespace === '') {
      return {
        task: null,
        taskError: null,
        taskLoaded: true
      };
    }
    return {
      task: this.index.findTask(this.props.namespace)
    };
  },

  render() {
    return (
      <div>
        <h4>Indexed Task</h4>
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

          <dt>Rank</dt>
          <dd>{this.state.task.rank}</dd>

          <dt>Expires</dt>
          <dd><format.DateView date={this.state.task.expires} /></dd>

          <dt>TaskId</dt>
          <dd><a href={inspectLink}>{this.state.task.taskId}</a></dd>
        </dl>
        <dl className="dl-horizontal">
          <dt>Data</dt>
          <dd>
            <JSONInspector data={this.state.task.data} />
          </dd>
        </dl>
      </div>
    );
  }
});
