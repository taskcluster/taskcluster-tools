import React from 'react';
import {Row, Col, ButtonToolbar, Button, Glyphicon, Table} from 'react-bootstrap';
import path from 'path';
import * as utils from '../lib/utils';
import taskcluster from 'taskcluster-client';
import SecretEditor from './secreteditor';

import './secretmanager.less';

const SecretsManager = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        secrets: taskcluster.Secrets
      }
    })
  ],

  /** Create an initial state */
  getInitialState() {
    const selectedSecretId = this.props.match.params.secretId ?
      decodeURIComponent(this.props.match.params.secretId) :
      '';

    return {
      selectedSecretId,
      secrets: undefined,
      secretsLoaded: false,
      secretsError: null,
    };
  },

  load() {
    return {
      secrets: this.secrets.list().then(resp => resp.secrets),
    };
  },

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
                onClick={this.reload}
                disabled={!this.state.secretsLoaded}>
                <Glyphicon glyph="refresh" /> Refresh
              </Button>
            </ButtonToolbar>
          </Col>
          <Col md={7}>
            <SecretEditor currentSecretId={this.state.selectedSecretId} reloadSecrets={this.reloadSecrets} />
          </Col>
        </Row>
      );
    } catch (e) {
      // TODO: Handle error
    }
  },

  renderSecretsTable() {
    return this.renderWaitFor('secrets') || (
        <Table condensed={true} hover={true}>
          <thead>
          <tr>
            <th>SecretId</th>
          </tr>
          </thead>
          <tbody>
          {this.state.secrets.map(this.renderSecretRow)}
          </tbody>
        </Table>
      );
  },

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
  },

  selectSecretId(secretId) {
    this.props.history.push(path.join('/secrets', encodeURIComponent(secretId)));
    this.setState({selectedSecretId: secretId});
  },

  reloadSecrets() {
    this.setState({selectedSecretId: ''});
    this.reload();
  },
});

export default SecretsManager;
