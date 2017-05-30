import React, { Component } from 'react';
import { Table, Label, Tab, Nav, NavItem, Row, Col } from 'react-bootstrap';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import path from 'path';
import { TaskClusterEnhance } from '../utils';
import * as format from '../format';
import LogView from './logview';
import ArtifactList from './artifactlist';
import './runinfo.less';

/** Displays information about a run in a tab page */
class RunInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      artifactsLoaded: true,
      artifactsError: null,
      artifacts: []
    };

    this.onTabSelect = this.onTabSelect.bind(this);
    this.handleArtifactCreatedMessage = this.handleArtifactCreatedMessage.bind(this);
    this.load = this.load.bind(this);
    this.onTaskClusterReload = this.onTaskClusterReload.bind(this);
    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
  }

  componentWillMount() {
    document.addEventListener('taskcluster-reload', this.onTaskClusterReload, false);
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);

    this.load();
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-reload', this.onTaskClusterReload, false);
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
  }

  componentDidUpdate(prevProps, prevState) {
    this.props.taskclusterState(this.state, this.props);
  }

  onTaskClusterReload() {
    this.load();
  }

  onTaskClusterUpdate({ detail }) {
    if (detail.name !== this.constructor.name) {
      return;
    }

    this.setState(detail.state);
  }

  /** Load list of artifacts */
  load(data) {
    if (typeof data === 'object' && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    const runId = this.props.run.runId;
    const taskId = this.props.status.taskId;
    const promisedState = {
      // Get list of artifacts, and take the `artifacts` property from the response
      artifacts: this.props.clients.queue
        .listArtifacts(taskId, runId)
        .then(_.property('artifacts'))
    };

    this.props.loadState(promisedState);
  }

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
  }

  onTabSelect(tab) {
    const { taskGroupId, taskId, run } = this.props.match.params;
    const pathSoFar = taskGroupId ? path.join(taskGroupId, taskId, run) : path.join(taskId, run);
    const directory = this.props.match.url.split('/').filter(e => e.length)[0];

    this.props.history.push(path.join('/', directory, pathSoFar, tab));
  }

  // Render run
  render() {
    const { run, activeTabOnInit } = this.props;
    const stateLabelMap = {
      pending: 'info',
      running: 'primary',
      completed: 'success',
      failed: 'danger',
      exception: 'warning'
    };

    return (
      <Tab.Container onSelect={this.onTabSelect} id="run-container" defaultActiveKey={activeTabOnInit || 'details'}>
        <Row>
          <Col sm={12}>
            <Nav bsStyle="pills">
              <NavItem eventKey="details">Run {run.runId} Details</NavItem>
              <NavItem eventKey="artifacts">Artifacts</NavItem>
              <NavItem eventKey="logs">Logs</NavItem>
            </Nav>
          </Col>
          <Col sm={12}>
            <Tab.Content>
              <Tab.Pane eventKey="details">
                <Table>
                  <tbody>
                    <tr>
                      <td>State</td>
                      <td>
                        <Label bsStyle={stateLabelMap[run.state]}>{run.state}</Label>
                      </td>
                    </tr>

                    <tr>
                      <td>Reason Created</td>
                      <td><code>{run.reasonCreated}</code></td>
                    </tr>

                    <tr>
                      <td>Reason Resolved</td>
                      <td>
                        {run.reasonResolved ? <code>{run.reasonResolved}</code> : '-'}
                      </td>
                    </tr>

                    <tr>
                      <td>Scheduled</td>
                      <td>
                        <format.DateView date={run.scheduled} />
                      </td>
                    </tr>

                    <tr>
                      <td>Started</td>
                      <td>
                        {
                          run.started ?
                            <format.DateView date={run.started} since={run.scheduled} /> :
                            '-'
                        }
                      </td>
                    </tr>

                    <tr>
                      <td>Resolved</td>
                      <td>
                        {
                          run.resolved ?
                            <format.DateView date={run.resolved} since={run.started} /> :
                            '-'
                        }
                      </td>
                    </tr>

                    <tr>
                      <td>WorkerGroup</td>
                      <td>
                        {run.workerGroup ? <code>{run.workerGroup}</code> : '-'}
                      </td>
                    </tr>

                    <tr>
                      <td>WorkerId</td>
                      <td>
                        {run.workerId ? <code>{run.workerId}</code> : '-'}
                      </td>
                    </tr>

                    <tr>
                      <td>TakenUntil</td>
                      <td>
                        {run.takenUntil ? <format.DateView date={run.takenUntil} /> : '-'}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Tab.Pane>
              <Tab.Pane eventKey="artifacts">
                {this.props.renderWaitFor('artifacts') || this.renderArtifacts()}
              </Tab.Pane>
              <Tab.Pane eventKey="logs" unmountOnExit={true}>
                {this.props.renderWaitFor('artifacts') || this.renderLogView()}
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    );
  }

  /** Render list of artifacts */
  renderArtifacts() {
    // Show dash to indicate empty list of artifacts
    if (!this.state.artifacts || (this.state.artifacts && this.state.artifacts.length === 0)) {
      return '-';
    }

    return (
      <ArtifactList
        taskId={this.props.status.taskId}
        runId={this.props.run.runId}
        artifacts={this.state.artifacts} />
    );
  }

  /** Render log viewer */
  renderLogView() {
    const logs = this.state.artifacts ?
      this.state.artifacts.filter(artifact => /^public\/logs\//.test(artifact.name)) :
      [];

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
}

RunInfo.propTypes = {
  status: React.PropTypes.object.isRequired,
  run: React.PropTypes.object.isRequired
};

const taskclusterOpts = {
  // Need updated clients for Queue
  clients: { queue: taskcluster.Queue },
  // Reload when status.taskId changes or run.runId
  reloadOnProps: ['status.taskId', 'run.runId'],
  reloadOnLogin: true,
  name: RunInfo.name
};

export default TaskClusterEnhance(RunInfo, taskclusterOpts);
