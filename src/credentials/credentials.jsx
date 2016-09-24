import React from 'react';
import { Row, Col, ButtonToolbar, Button, Glyphicon } from 'react-bootstrap';
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
        <Col lg={6} lgOffset={3} md={8} mdOffset={2} sm={10} smOffset={1}>
          <h2>TaskCluster Credentials</h2>
          <hr/>
          <CredentialView credentials={this.state.credentials}/>
          <ButtonToolbar>
            <Button bsStyle="primary" onClick={this.signIn}>
              <Glyphicon glyph="log-in"/> Sign In
            </Button>
            <Button bsStyle="danger" onClick={this.signOut}>
              <Glyphicon glyph="log-out"/> Sign Out
            </Button>
          </ButtonToolbar>
        </Col>
      </Row>
    );
  },

  signIn() {
    window.open(auth.buildLoginURL(), '_blank');
  },

  signOut() {
    auth.saveCredentials(undefined);
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
          <div>
            <p>No credentials loaded. Please sign in.</p>
          </div>
        );
      }

      return (
        <div>
          <dl className="dl-horizontal">
            <dt>ClientId</dt>
            <dd><code>{info.clientId}</code></dd>

            <dt>AccessToken</dt>
            {
              showToken ?
                <dd><code>{this.props.credentials.accessToken}</code></dd> :
                <dd><a href="#" onClick={this.showToken}>show</a></dd>
            }

            <dt>Type</dt>
            <dd>{info.type}</dd>

            {info.start ? <dt>Valid From</dt> : null}
            {info.start ? <dd><format.DateView date={info.start} /></dd> : null}
            {info.expiry ? <dt>Expires</dt> : null}
            {info.expiry ? <dd><format.DateView date={info.expiry} /></dd> : null}

            <dt>Scopes</dt>
            <dd>
              {
                info.scopes.length ? (
                  <ul>
                    {info.scopes.map((scope, index) => <li key={index}><code>{scope}</code></li>)}
                  </ul>
                ) : 'none (or accessToken is invalid)'
              }
            </dd>
          </dl>
        </div>
      );
    })();
  },

  showToken() {
    this.setState({ showToken: true });
  }
});
