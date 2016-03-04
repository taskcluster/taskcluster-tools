var React            = require('react');
var bs               = require('react-bootstrap');
var taskcluster      = require('taskcluster-client');
var auth             = require('../lib/auth');
var utils            = require('../lib/utils');
let format           = require('../lib/format');
let _                = require('lodash');

var CredentialManager = React.createClass({
  getInitialState() {
    return {
      credentials: auth.loadCredentials(),
    }
  },

  render() {
    return <bs.Row>
      <bs.Col lg={6} lgOffset={3} md={8} mdOffset={2} sm={10} smOffset={1}>
        <h2>TaskCluster Credentials</h2>
        <hr/>
        <CredentialView credentials={this.state.credentials}/>
        <bs.ButtonToolbar>
          <bs.Button bsStyle="primary"
                     onClick={this.signIn}>
            <bs.Glyphicon glyph="log-in" />&nbsp; Sign In
          </bs.Button>
          <bs.Button
            bsStyle="danger"
            onClick={this.signOut}>
            <bs.Glyphicon glyph="log-out" />&nbsp; Sign Out
          </bs.Button>
        </bs.ButtonToolbar>
      </bs.Col>
    </bs.Row>
  },

  signIn() {
    window.open(auth.buildLoginURL(), '_blank');
  },

  signOut() {
    auth.saveCredentials(undefined);
  },

  handleCredentialsChanged() {
    this.setState({
      credentials: auth.loadCredentials(),
    });
  },

  /** Listen for credentials-changed events */
  componentDidMount() {
    window.addEventListener(
      'credentials-changed',
      this.handleCredentialsChanged,
      false
    );
  },

  /** Stop listening for credentials-changed events */
  componentWillUnmount() {
    window.removeEventListener(
      'credentials-changed',
      this.handleCredentialsChanged,
      false
    );
  },

});

var CredentialView = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      reloadOnProps: ['credentials']
    })
  ],

  getInitialState() {
    return {
      info: null,
      showToken: false
    }
  },

  load() {
    if (this.props.credentials) {
      return {
        info: taskcluster.credentialInformation(this.props.credentials),
      };
    } else {
      return {
        info: null,
        infoLoaded: true
      };
    }
  },

  render: function() {
    let info = this.state.info;
    let showToken = this.state.showToken;

    let content = info ? <div>
        <dl className="dl-horizontal">
          <dt>ClientId</dt>
          <dd><code>{info.clientId}</code></dd>
          <dt>AccessToken</dt>
          {showToken ?
            <dd><code>{this.props.credentials.accessToken}</code></dd> :
            <dd>
              <a href="#" onClick={this.showToken}>show</a>
            </dd>
          }
          <dt>Type</dt>
          <dd>{info.type}</dd>
          {info.start  ? <dt>Valid From</dt> : undefined}
          {info.start  ? <dd><format.DateView date={info.start}/></dd> : undefined}
          {info.expiry ? <dt>Expires</dt> : undefined}
          {info.expiry ? <dd><format.DateView date={info.expiry}/></dd> : undefined}
          <dt>Scopes</dt>
          <dd>
            {
              info.scopes.length > 0 ? (
                <ul>
                  {
                    info.scopes.map((scope, index) => {
                      return <li key={index}><code>{scope}</code></li>;
                    })
                  }
                </ul>
              ) : (
                'none (or accessToken is invalid)'
              )
            }
          </dd>
        </dl>
      </div> : <div>
        <p>No credentials loaded.  Please sign in.</p>
      </div>
    return this.renderWaitFor('info') || content;
  },

  showToken() {
    this.setState({showToken: true});
  },
});

exports.CredentialManager = CredentialManager;
