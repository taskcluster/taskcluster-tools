import React from 'react';
import { Row, Col } from 'react-bootstrap';
import taskcluster from 'taskcluster-client';
import * as auth from '../lib/auth';
import * as utils from '../lib/utils';
import * as format from '../lib/format';

export default React.createClass({
  displayName: 'CredentialsManager',

  getInitialState() {
    return {
      credentials: auth.loadCredentials()
    };
  },

  render() {
    return (
      <Row>
        <Col sm={12}>
          <h4>TaskCluster Credentials</h4>
          <CredentialView credentials={this.state.credentials} />
        </Col>
      </Row>
    );
  },

  handleCredentialsChanged() {
    this.setState({
      credentials: auth.loadCredentials()
    });
  },

  /** Listen for credentials-changed events */
  componentDidMount() {
    window.addEventListener('credentials-changed', this.handleCredentialsChanged, false);
  },

  /** Stop listening for credentials-changed events */
  componentWillUnmount() {
    window.removeEventListener('credentials-changed', this.handleCredentialsChanged, false);
  }

});

const CredentialView = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      reloadOnProps: ['credentials']
    })
  ],

  getInitialState() {
    return {
      info: null,
      showToken: false
    };
  },

  load() {
    return this.props.credentials ?
      { info: taskcluster.credentialInformation(this.props.credentials) } :
      { info: null, infoLoaded: true };
  },

  render() {
    const info = this.state.info;
    const showToken = this.state.showToken;

    return this.renderWaitFor('info') || (() => {
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
                  showToken ?
                    <td><code>{this.props.credentials.accessToken}</code></td> :
                    <td><a href="#" onClick={this.showToken}>show</a></td>
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
                          {info.scopes.map((scope, key) => (
                            <div key={key}><code>{scope}</code></div>
                          ))}
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
  },

  showToken() {
    this.setState({ showToken: true });
  }
});
