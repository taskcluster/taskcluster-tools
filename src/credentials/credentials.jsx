import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import taskcluster from 'taskcluster-client';
import * as auth from '../lib/auth';
import { TaskClusterEnhance } from '../lib/utils';
import * as format from '../lib/format';

export default class CredentialsManager extends Component {
  constructor(props) {
    super(props);

    this.state = { credentials: auth.loadCredentials() };

    this.handleCredentialsChanged = this.handleCredentialsChanged.bind(this);
  }

  render() {
    return (
      <Row>
        <Col sm={12}>
          <h4>TaskCluster Credentials</h4>
          <CredentialViewEnhanced credentials={this.state.credentials} />
        </Col>
      </Row>
    );
  }

  handleCredentialsChanged() {
    this.setState({ credentials: auth.loadCredentials() });
  }

  /** Listen for credentials-changed events */
  componentDidMount() {
    window.addEventListener('credentials-changed', this.handleCredentialsChanged, false);
  }

  /** Stop listening for credentials-changed events */
  componentWillUnmount() {
    window.removeEventListener('credentials-changed', this.handleCredentialsChanged, false);
  }
}

class CredentialView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      info: null,
      showToken: false
    };

    this.showToken = this.showToken.bind(this);
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

  onTaskClusterUpdate({ detail }) {
    if (detail.name !== this.constructor.name) {
      return;
    }

    this.setState(detail.state);
  }

  componentDidUpdate(prevProps, prevState) {
    this.props.taskclusterState(this.state, this.props);
  }

  load(data) {
    if (typeof data === 'object' && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    const promisedState = this.props.credentials ?
      { info: taskcluster.credentialInformation(this.props.credentials) } :
      { info: null, infoLoaded: true };

    this.props.loadState(promisedState);
  }

  render() {
    const info = this.state.info;
    const showToken = this.state.showToken;

    return this.props.renderWaitFor('info') || (() => {
      if (!info) {
        return (
          <div style={{ marginTop: 20 }}>
            <p>No credentials loaded. Please sign in.</p>
          </div>
        );
      }

      return (
        <div style={{ marginTop: 20 }}>
          <table className="table">
            <tbody>
              <tr>
                <td>ClientId</td>
                <td><code>{info.clientId}</code></td>
              </tr>

              <tr>
                <td>AccessToken</td>
                {
                  (showToken && this.props.credentials) ? (
                    <td>
                      <code>{this.props.credentials.accessToken}</code>
                    </td>
                  ) : (
                    <td>
                      <a href="#" onClick={this.showToken}>show</a>
                    </td>
                  )
                }
              </tr>

              <tr>
                <td>Type</td>
                <td>{info.type}</td>
              </tr>

              {(() => {
                if (info.start) {
                  return (
                    <tr>
                      <td>Valid From</td>
                      <td><format.DateView date={info.start} /></td>
                    </tr>
                  );
                }
              })()}

              {(() => {
                if (info.expiry) {
                  return (
                    <tr>
                      <td>Expires</td>
                      <td><format.DateView date={info.expiry} /></td>
                    </tr>
                  );
                }
              })()}

              <tr>
                <td>Scopes</td>
                <td>
                  {
                    info.scopes.length ? (
                      <div style={{ lineHeight: 1.8 }}>
                        {info.scopes.map((scope, key) => <div key={key}><code>{scope}</code></div>)}
                      </div>
                    ) :
                    'none (or accessToken is invalid)'
                  }
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    })();
  }

  showToken() {
    this.setState({ showToken: true });
  }
}

const CredentialViewTaskclusterOpts = {
  reloadOnProps: ['credentials'],
  name: CredentialView.name
};
const CredentialViewEnhanced = TaskClusterEnhance(CredentialView, CredentialViewTaskclusterOpts);
