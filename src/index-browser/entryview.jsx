import React, {Component} from 'react';
import {TaskClusterEnhance} from '../lib/utils';
import taskcluster from 'taskcluster-client';
import * as format from '../lib/format';
import JSONInspector from 'react-json-inspector';
import './entryview.less';

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
    if (detail.name !== this.constructor.name) {
      return;
    }

    this.setState(detail.state);
  }

  load(data) {
    if (typeof data === 'object' && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    const promisedState = this.props.namespace === '' ?
      {
        task: null,
        taskError: null,
        taskLoaded: true,
      } :
      {
        task: this.props.clients.index.findTask(this.props.namespace),
      };

    this.props.loadState(promisedState);
  }

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
}

const taskclusterOpts = {
  clients: {
    index: taskcluster.Index,
  },
  // Reload when props.namespace changes, ignore credentials changes
  reloadOnProps: ['namespace'],
  reloadOnLogin: false,
  name: EntryView.name
};

EntryView.propTypes = {namespace: React.PropTypes.string.isRequired};

export default TaskClusterEnhance(EntryView, taskclusterOpts);
