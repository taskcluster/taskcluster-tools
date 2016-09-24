import React from 'react';
import * as utils from '../utils';
import * as format from '../format';
import _ from 'lodash';
import taskcluster from 'taskcluster-client';
import LogView from './logview';
import ArtifactList from './artifactlist';

/** Displays information about a run in a tab page */
const RunInfo = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      // Need updated clients for Queue
      clients: {
        queue: taskcluster.Queue
      },
      // Reload when status.taskId changes or run.runId
      reloadOnProps: ['status.taskId', 'run.runId'],
      reloadOnLogin: true
    })
  ],

  // Validate properties
  propTypes: {
    status: React.PropTypes.object.isRequired,
    run: React.PropTypes.object.isRequired
  },

  // Get initial state
  getInitialState() {
    return {
      artifactsLoaded: true,
      artifactsError: null,
      artifacts: []
    };
  },

  /** Load list of artifacts */
  load() {
    const runId = this.props.run.runId;
    const taskId = this.props.status.taskId;

    return {
      // Get list of artifacts, and take the `artifacts` property from the response
      artifacts: this.queue
        .listArtifacts(taskId, runId)
        .then(_.property('artifacts'))
    };
  },

  /** Handle artifact created messages, provided by parents */
  handleArtifactCreatedMessage(message) {
    const notMatch = message.payload.status.taskId !== this.props.status.taskId ||
      message.payload.runId !== this.props.run.runId;

    // Check that taskId and runId matches this run
    if (notMatch) {
      return;
    }

    // If artifacts haven't been loaded, we return
    if (!this.state.artifactsLoaded || !this.state.artifacts) {
      return;
    }

    // Find index of artifact, assuming we already have the artifact
    // This in case we overwrite an artifact, only possible for reference
    // artifacts, but a use-case...
    let index = _.findIndex(this.state.artifacts, {
      name: message.payload.artifact.name
    });

    // If not present in the list, we index to length, as this equals appending
    if (index === -1) {
      index = this.state.artifacts.length;
    }

    // Shallow clone should do fine
    const artifacts = [...this.state.artifacts];

    // Insert/update artifact
    artifacts[index] = message.payload.artifact;

    // Update state
    this.setState({ artifacts });
  },

  // Render run
  render() {
    const run = this.props.run;

    const stateLabelMap = {
      pending: 'info',
      running: 'primary',
      completed: 'success',
      failed: 'danger',
      exception: 'warning'
    };

    return (
      <span>
        <dl className="dl-horizontal">
          <dt>State</dt>
          <dd>
            <span className={`label label-${stateLabelMap[run.state]}`}>{run.state}</span>
          </dd>
          <dt>Reason Created</dt>
          <dd><code>{run.reasonCreated}</code></dd>
          <dt>Reason Resolved</dt>
          <dd>
            {run.reasonResolved ? <code>{run.reasonResolved}</code> : '-'}
          </dd>
        </dl>
        <dl className="dl-horizontal">
          <dt>Artifacts</dt>
          <dd>{this.renderWaitFor('artifacts') || this.renderArtifacts()}</dd>
        </dl>
        <dl className="dl-horizontal">
          <dt>Scheduled</dt>
          <dd>
            <format.DateView date={run.scheduled}/>
          </dd>
          <dt>Started</dt>
          <dd>
            {
              run.started ?
                <format.DateView date={run.started} since={run.scheduled} /> :
                '-'
            }
          </dd>
          <dt>Resolved</dt>
          <dd>
            {
              run.resolved ?
                <format.DateView date={run.resolved} since={run.started} /> :
                '-'
            }
          </dd>
        </dl>
        <dl className="dl-horizontal">
          <dt>WorkerGroup</dt>
          <dd>
            {run.workerGroup ? <code>{run.workerGroup}</code> : '-'}
          </dd>
          <dt>WorkerId</dt>
          <dd>
            {run.workerId ? <code>{run.workerId}</code> : '-'}
          </dd>
          <dt>TakenUntil</dt>
          <dd>
            {run.takenUntil ? <format.DateView date={run.takenUntil}/> : '-'}
          </dd>
        </dl>
        <hr/>
        {this.renderWaitFor('artifacts') || this.renderLogView()}
      </span>
    );
  },

  /** Render list of artifacts */
  renderArtifacts() {
    // Show dash to indicate empty list of artifacts
    if (this.state.artifacts.length === 0) {
      return '-';
    }

    return (
      <ArtifactList
        taskId={this.props.status.taskId}
        runId={this.props.run.runId}
        artifacts={this.state.artifacts} />
    );
  },

  /** Render log viewer */
  renderLogView() {
    const logs = this.state.artifacts.filter(artifact => /^public\/logs\//.test(artifact.name));

    if (logs.length === 0) {
      return;
    }

    return (
      <LogView
        logs={logs}
        taskId={this.props.status.taskId}
        runId={this.props.run.runId} />
    );
  }
});

export default RunInfo;
