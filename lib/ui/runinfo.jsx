/** @jsx React.DOM */
var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../utils');
var format          = require('../format');
var _               = require('lodash');
var taskcluster     = require('taskcluster-client');
var LogView         = require('./logview');
var ArtifactList    = require('./artifactlist');


/** Displays information about a run in a tab page */
var RunInfo = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      // Need updated clients for Queue
      clients: {
        queue:                taskcluster.Queue
      },
      // Reload when status.taskId changes or run.runId
      reloadOnProps:          ['status.taskId', 'run.runId'],
      reloadOnLogin:          true
    })
  ],

  // Validate properties
  propTypes: {
    status:   React.PropTypes.object.isRequired,
    run:      React.PropTypes.object.isRequired
  },

  // Get initial state
  getInitialState: function() {
    return {
      artifactsLoaded:  true,
      artifactsError:   undefined,
      artifacts:        []
    };
  },

  /** Load list of artifacts */
  load: function() {
    var runId   = this.props.run.runId;
    var taskId  = this.props.status.taskId;
    return {
      // Get list of artifacts, and take the `artifacts` property from the
      // response
      artifacts:      this.queue.listArtifacts(taskId, runId)
                                .then(_.property('artifacts'))
    };
  },

  // Render run
  render: function() {
    var run             = this.props.run;
    var status          = this.props.status;

    var stateLabelMap = {
      pending:    'info',
      running:    'primary',
      completed:  'success',
      failed:     'danger'
    };
    return (
      <span>
        <dl className="dl-horizontal">
          <dt>State</dt>
          <dd>
            <span className={"label label-" + stateLabelMap[run.state]}>
              {run.state}
            </span>
          </dd>
          <dt>Reason Created</dt>
          <dd><code>{run.reasonCreated}</code></dd>
        </dl>
        <dl className="dl-horizontal">
          <dt>Reason Resolved</dt>
          <dd>
            {run.reasonResolved ? <code>{run.reasonResolved}</code> : '-'}
          </dd>
          <dt>Successful</dt>
          <dd>
            {
              run.success === undefined || run.success === null
              ? '-'
              : (
                  run.success
                  ? <span className="label label-primary">yes</span>
                  : <span className="label label-primary">no</span>
                )
            }
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
              run.started
              ? <format.DateView date={run.started} since={run.scheduled}/>
              : '-'
            }
          </dd>
          <dt>Resolved</dt>
          <dd>
            {
              run.resolved
              ? <format.DateView date={run.resolved} since={run.started}/>
              : '-'
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
  renderArtifacts: function() {
    // Show dash to indicate empty list of artifacts
    if (this.state.artifacts.length === 0) {
      return '-';
    }

    return (
      <ArtifactList
        taskId={this.props.status.taskId}
        runId={this.props.run.runId}
        artifacts={this.state.artifacts}/>
    );
  },

  /** Render log viewer */
  renderLogView: function() {
    var logs = this.state.artifacts.filter(function(artifact) {
      return /^public\/logs\//.test(artifact.name);
    });
    if (logs.length === 0) {
      return undefined;
    }
    return (
      <LogView logs={logs}
               taskId={this.props.status.taskId}
               runId={this.props.run.runId}/>
    );
  }
});

// Export RunInfo
module.exports = RunInfo;