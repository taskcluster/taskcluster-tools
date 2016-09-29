import React from 'react';
import { Row, Col, ButtonToolbar, Button, Glyphicon, Table } from 'react-bootstrap';
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
    }),
    utils.createLocationHashMixin({
      keys: ['selectedSecretId'],
      type: 'string'
    })
  ],

  /** Create an initial state */
  getInitialState() {
    return {
      selectedSecretId: '',
      secrets: undefined,
      secretsLoaded: false,
      secretsError: null
    };
  },

  load() {
    return {
      secrets: this.secrets.list().then(resp => resp.secrets)
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
              <Button bsStyle="primary"
                         onClick={this.selectSecretId.bind(this, '')}
                         disabled={this.state.selectedSecretId === ''}>
                <Glyphicon glyph="plus"/>
                &nbsp;
                Add Secret
              </Button>
              <Button bsStyle="success"
                         onClick={this.reload}
                         disabled={!this.state.secretsLoaded}>
                <Glyphicon glyph="refresh"/>
                &nbsp;
                Refresh
              </Button>
            </ButtonToolbar>
          </Col>
          <Col md={7}>
            <SecretEditor currentSecretId={this.state.selectedSecretId}
                          reloadSecrets={this.reloadSecrets} />
          </Col>
        </Row>
      );
    } catch (e) {
      console.log(e);
    }
  },

  renderSecretsTable() {
    return this.renderWaitFor('secrets') || (
      <Table condensed hover>
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
    const isSelected = (this.state.selectedSecretId === secretId);
    return (
      <tr key={index}
          className={isSelected ? 'info' : undefined}
          onClick={this.selectSecretId.bind(this, secretId)}>
        <td><code>{secretId}</code></td>
      </tr>
    );
  },

  selectSecretId(secretId) {
    this.setState({ selectedSecretId: secretId });
  },

  reloadSecrets() {
    this.setState({ selectedSecretId: '' });
    this.reload();
  }
});

export default SecretsManager;
