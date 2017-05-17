import React, {Component} from 'react';
import {Row, Col, ButtonToolbar, Button, Glyphicon, Table} from 'react-bootstrap';
import path from 'path';
import {TaskClusterEnhance} from '../lib/utils';
import taskcluster from 'taskcluster-client';
import SecretEditor from './secreteditor';

import './secretmanager.less';

class SecretManager extends Component {
  constructor(props) {
    super(props);

    const selectedSecretId = this.props.match.params.secretId ?
      decodeURIComponent(this.props.match.params.secretId) :
      '';

    this.state = {
      selectedSecretId,
      secrets: undefined,
      secretsLoaded: false,
      secretsError: null,
    };

    this.renderSecretRow = this.renderSecretRow.bind(this);
    this.reloadSecrets = this.reloadSecrets.bind(this);
    this.selectSecretId = this.selectSecretId.bind(this);
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

  load(data) {
    // A component may have nested components. `data.detail.name` will identify
    // which component (possibly nested) needs to reload.
    if (data && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    const promisedState = {secrets: this.props.clients.secrets.list().then(resp => resp.secrets)};

    this.props.loadState(promisedState);
  }

  onTaskClusterUpdate({detail}) {
    this.setState(detail);
  }

  /** Render the main layout of the secrets manager page */
  render() {
    try {
      return (
        <Row>
          <Col md={5}>
            {this.renderSecretsTable()}
            <ButtonToolbar>
              <Button
                bsStyle="primary"
                onClick={() => this.selectSecretId('')}
                disabled={this.state.selectedSecretId === ''}>
                <Glyphicon glyph="plus" /> Add Secret
              </Button>
              <Button
                bsStyle="success"
                onClick={this.load}
                disabled={!this.state.secretsLoaded}>
                <Glyphicon glyph="refresh" /> Refresh
              </Button>
            </ButtonToolbar>
          </Col>
          <Col md={7}>
            <SecretEditor
              currentSecretId={this.state.selectedSecretId}
              reloadSecrets={this.reloadSecrets}
              selectSecretId={this.selectSecretId}
              {...this.props} />
          </Col>
        </Row>
      );
    } catch (e) {
      // TODO: Handle error
    }
  }

  renderSecretsTable() {
    return this.props.renderWaitFor('secrets') || (
        <Table condensed={true} hover={true}>
          <thead>
          <tr>
            <th>SecretId</th>
          </tr>
          </thead>
          <tbody>
          {this.state.secrets && this.state.secrets.map(this.renderSecretRow)}
          </tbody>
        </Table>
      );
  }

  renderSecretRow(secretId, index) {
    const isSelected = this.state.selectedSecretId === secretId;

    return (
      <tr
        key={index}
        className={isSelected ? 'info' : null}
        onClick={() => this.selectSecretId(secretId)}>
        <td><code>{secretId}</code></td>
      </tr>
    );
  }

  selectSecretId(secretId) {
    this.props.history.push(path.join('/secrets', encodeURIComponent(secretId)));
    this.setState({selectedSecretId: secretId});
  }

  reloadSecrets() {
    this.selectSecretId('');
    this.load();
  }
}

const taskclusterOpts = {
  clients: {
    secrets: taskcluster.Secrets
  },
  name: SecretManager.name
};

export default TaskClusterEnhance(SecretManager, taskclusterOpts);
