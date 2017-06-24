import React from 'react';
import { BrowserRouter, Redirect, Switch } from 'react-router-dom';
import { Helmet, link } from 'react-helmet';
import { Grid } from 'react-bootstrap';
import PropsRoute from '../components/PropsRoute';
import Navigation from '../components/Navigation';
import Login from '../views/Login';
import { getLoginUrl, loadable } from '../utils';
import './styles.css';
import iconUrl from '../taskcluster.png';

const expirationTimeout = 5 * 60 * 1000; // time before expiration at which we warn
const Home = loadable(() => import('../views/Home'));
const TaskCreator = loadable(() => import('../views/TaskCreator'));
const TaskRedirect = loadable(() => import('../views/TaskRedirect'));
const UnifiedInspector = loadable(() => import('../views/UnifiedInspector'));
const QuickStart = loadable(() => import('../views/QuickStart'));
const AwsProvisioner = loadable(() => import('../views/AwsProvisioner'));
const ClientManager = loadable(() => import('../views/ClientManager'));
const RoleManager = loadable(() => import('../views/RoleManager'));
const ScopeInspector = loadable(() => import('../views/ScopeInspector'));
const PulseInspector = loadable(() => import('../views/PulseInspector'));
const CachePurgeInspector = loadable(() => import('../views/CachePurgeInspector'));
const IndexedArtifactBrowser = loadable(() => import('../views/IndexedArtifactBrowser'));
const IndexBrowser = loadable(() => import('../views/IndexBrowser'));
const HooksManager = loadable(() => import('../views/HooksManager'));
const SecretsManager = loadable(() => import('../views/SecretsManager'));
const Status = loadable(() => import('../views/Status'));
const Diagnostics = loadable(() => import('../views/Diagnostics'));
const CredentialsManager = loadable(() => import('../views/CredentialsManager'));
const Displays = loadable(() => import('../views/Displays'));
const Shell = loadable(() => import('../views/Shell'));
const InteractiveConnect = loadable(() => import('../views/InteractiveConnect'));

export class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.loadCredentials(),
      credentialsExpiringSoon: false,
      manualClientId: '',
      manualAccessToken: '',
      manualCertificate: ''
    };
  }

  componentWillMount() {
    window.addEventListener('storage', this.handleStorage);
  }

  componentDidMount() {
    this.startExpirationTimer();
  }

  componentWillUnmount() {
    this.stopExpirationTimer();
  }

  handleStorage = ({ storageArea, key, newValue }) => {
    if (storageArea === localStorage && key === 'credentials') {
      this.setState({ credentials: newValue ? JSON.parse(newValue) : null });
    }
  };

  handleCredentialsChanged = () => {
    this.setState({ ...this.loadCredentials(), credentialsExpiringSoon: false });
    this.startExpirationTimer();
  };

  saveCredentials = (credentials) => {
    if (!credentials) {
      localStorage.removeItem('credentials');
      this.setState({ credentials: null });
    } else {
      const clone = {
        ...credentials,
        certificate: typeof credentials.certificate === 'string' ?
          JSON.parse(credentials.certificate) :
          credentials.certificate
      };

      this.setState({ credentials: clone });
      localStorage.setItem('credentials', JSON.stringify(clone));
    }
  };

  loadCredentials() {
    const credentials = JSON.parse(localStorage.getItem('credentials'));

    // We have no credentials
    if (!credentials) {
      return { credentials: null };
    }

    const { certificate } = credentials;
    const isExpired = certificate && certificate.expiry < Date.now();

    if (isExpired && this.state && this.state.credentialsExpiredTimeout) {
      clearTimeout(this.state.credentialsExpiredTimeout);
    }

    return {
      credentials: isExpired ? null : credentials,
      credentialsExpiredTimeout: credentials && certificate && certificate.expiry ?
        setTimeout(() => this.setState({ credentials: null }), certificate.expiry - Date.now()) :
        null
    };
  }

  startExpirationTimer() {
    this.stopExpirationTimer();

    const { credentials } = this.state;

    // We only support monitoring expiration of temporary credentials.
    // Anything else requires hitting the auth API, and temporary credentials are the common case.
    if (!credentials || !credentials.certificate || !credentials.certificate.expiry) {
      return;
    }

    const { expiry } = credentials.certificate;

    if (expiry < (Date.now() + expirationTimeout)) {
      this.setState({ credentialsExpiringSoon: true });
      return;
    }

    const timeout = (expiry - Date.now()) - (expirationTimeout + 500);

    this.setState({
      expirationTimer: setTimeout(() => this.setState({ credentialsExpiringSoon: true }), timeout)
    });
  }

  stopExpirationTimer() {
    if (this.state.expirationTimer) {
      clearTimeout(this.state.expirationTimer);
      this.setState({ expirationTimer: null });
    }
  }

  signOut() {
    this.saveCredentials(null);
  }

  signInManually({ clientId, accessToken, certificate }) {
    this.saveCredentials({
      clientId,
      accessToken,
      certificate: certificate === '' ? certificate : JSON.parse(certificate)
    });
  }

  render() {
    const { credentials, credentialsExpiringSoon } = this.state;

    return (
      <BrowserRouter>
        <div>
          <Helmet>
            <link rel="shortcut icon" type="image/png" href={iconUrl} />
          </Helmet>
          <PropsRoute
            component={Navigation}
            credentials={credentials}
            credentialsExpiringSoon={credentialsExpiringSoon}
            signInManually={credentials => this.signInManually(credentials)}
            loginUrl={getLoginUrl()}
            onSignOut={() => this.signOut()} />

          <Grid fluid id="container">
            <Switch>
              <Redirect from="/interactive" to="/shell" />
              <PropsRoute path="/login" component={Login} saveCredentials={this.saveCredentials} />
              <PropsRoute path="/" exact={true} component={Home} credentials={credentials} />
              <PropsRoute path="/tasks/create" component={TaskCreator} credentials={credentials} />
              <PropsRoute path="/tasks/:taskId/connect" component={InteractiveConnect} credentials={credentials} />
              <PropsRoute path="/tasks/:taskId" component={TaskRedirect} credentials={credentials} />
              <PropsRoute
                path="/groups/:taskGroupId?/:groupSection?/:taskId?/:sectionId?/:runId?/:subSectionId?/:artifactId?"
                component={UnifiedInspector}
                credentials={credentials} />
              <PropsRoute path="/quickstart" component={QuickStart} credentials={credentials} />
              <PropsRoute
                path="/aws-provisioner/:workerType?/:currentTab?"
                component={AwsProvisioner}
                credentials={credentials} />
              <PropsRoute path="/auth/clients/:clientId?" component={ClientManager} credentials={credentials} />
              <PropsRoute path="/auth/roles/:roleId?" component={RoleManager} credentials={credentials} />
              <PropsRoute path="/auth/scopes/:selectedScope?/:selectedEntity?" component={ScopeInspector} credentials={credentials} />
              <PropsRoute path="/pulse-inspector" component={PulseInspector} credentials={credentials} />
              <PropsRoute path="/purge-caches" component={CachePurgeInspector} credentials={credentials} />
              <PropsRoute path="/index/artifacts/:namespace?/:namespaceTaskId?" component={IndexedArtifactBrowser} credentials={credentials} />
              <PropsRoute path="/index/:namespace?/:namespaceTaskId?" component={IndexBrowser} credentials={credentials} />
              <PropsRoute path="/hooks/:hookGroupId?/:hookId?" component={HooksManager} credentials={credentials} />
              <PropsRoute path="/secrets/:secretId?" component={SecretsManager} credentials={credentials} />
              <PropsRoute path="/status" component={Status} credentials={credentials} />
              <PropsRoute path="/diagnostics" component={Diagnostics} credentials={credentials} />
              <PropsRoute path="/credentials" component={CredentialsManager} credentials={credentials} />
              <PropsRoute path="/display" component={Displays} credentials={credentials} />
              <PropsRoute path="/shell" component={Shell} credentials={credentials} />
            </Switch>
          </Grid>
        </div>
      </BrowserRouter>
    );
  }
}
