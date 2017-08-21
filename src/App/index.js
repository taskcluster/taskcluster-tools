import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { Helmet, link } from 'react-helmet';
import { Grid } from 'react-bootstrap';
import PropsRoute from '../components/PropsRoute';
import Navigation from '../components/Navigation';
import Login from '../views/Login';
import NotFound from '../components/NotFound';
import { getLoginUrl, loadable } from '../utils';
import './styles.css';
import iconUrl from '../taskcluster.png';
import LegacyRedirect from './LegacyRedirect';

const expirationTimeout = 5 * 60 * 1000; // time before expiration at which we warn
const Home = loadable(() => import(/* webpackChunkName: 'Home' */ '../views/Home'));
const TaskCreator = loadable(() => import(/* webpackChunkName: 'TaskCreator' */ '../views/TaskCreator'));
const TaskRedirect = loadable(() => import(/* webpackChunkName: 'TaskRedirect' */ '../views/TaskRedirect'));
const UnifiedInspector = loadable(() => import(/* webpackChunkName: 'UnifiedInspector' */ '../views/UnifiedInspector'));
const QuickStart = loadable(() => import(/* webpackChunkName: 'QuickStart' */ '../views/QuickStart'));
const AwsProvisioner = loadable(() => import(/* webpackChunkName: 'AwsProvisioner' */ '../views/AwsProvisioner'));
const ClientManager = loadable(() => import(/* webpackChunkName: 'ClientManager' */ '../views/ClientManager'));
const RoleManager = loadable(() => import(/* webpackChunkName: 'RoleManager' */ '../views/RoleManager'));
const ScopeInspector = loadable(() => import(/* webpackChunkName: 'ScopeInspector' */ '../views/ScopeInspector'));
const PulseInspector = loadable(() => import(/* webpackChunkName: 'PulseInspector' */ '../views/PulseInspector'));
const CachePurgeInspector = loadable(() => import(/* webpackChunkName: 'CachePurgeInspector' */ '../views/CachePurgeInspector'));
const IndexedArtifactBrowser = loadable(() => import(/* webpackChunkName: 'IndexedArtifactBrowser' */ '../views/IndexedArtifactBrowser'));
const IndexBrowser = loadable(() => import(/* webpackChunkName: 'IndexBrowser' */ '../views/IndexBrowser'));
const HooksManager = loadable(() => import(/* webpackChunkName: 'HooksManager' */ '../views/HooksManager'));
const SecretsManager = loadable(() => import(/* webpackChunkName: 'SecretsManager' */ '../views/SecretsManager'));
const Diagnostics = loadable(() => import(/* webpackChunkName: 'Diagnostics' */ '../views/Diagnostics'));
const CredentialsManager = loadable(() => import(/* webpackChunkName: 'CredentialsManager' */ '../views/CredentialsManager'));
const Displays = loadable(() => import(/* webpackChunkName: 'Displays' */ '../views/Displays'));
const Shell = loadable(() => import(/* webpackChunkName: 'Shell' */ '../views/Shell'));
const InteractiveConnect = loadable(() => import(/* webpackChunkName: 'InteractiveConnect' */ '../views/InteractiveConnect'));

export default class App extends React.Component {
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
    const storedCredentials = localStorage.getItem('credentials');

    // We have no credentials
    if (!storedCredentials) {
      return { credentials: null };
    }

    const credentials = JSON.parse(storedCredentials);
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

  startExpirationTimer = () => {
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
  };

  stopExpirationTimer = () => {
    if (this.state.expirationTimer) {
      clearTimeout(this.state.expirationTimer);
      this.setState({ expirationTimer: null });
    }
  };

  signOut = () => this.saveCredentials(null);

  signInManually = ({ clientId, accessToken, certificate }) => {
    this.saveCredentials({
      clientId,
      accessToken,
      certificate: certificate ? JSON.parse(certificate) : null
    });
  };

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
            signInManually={this.signInManually}
            loginUrl={getLoginUrl()}
            onSignOut={this.signOut} />

          <Grid fluid id="container">
            <Switch>
              <PropsRoute path="/task-inspector" component={LegacyRedirect} />
              <PropsRoute path="/task-graph-inspector" component={LegacyRedirect} />
              <PropsRoute path="/task-group-inspector" component={LegacyRedirect} />
              <PropsRoute path="/push-inspector" component={LegacyRedirect} />
              <PropsRoute path="/one-click-loaner" component={LegacyRedirect} />
              <PropsRoute path="/interactive" component={LegacyRedirect} />
              <PropsRoute path="/task-creator" component={LegacyRedirect} />

              <PropsRoute path="/login" component={Login} saveCredentials={this.saveCredentials} />
              <PropsRoute path="/" exact={true} component={Home} credentials={credentials} />
              <PropsRoute path="/tasks/create/interactive" component={TaskCreator} credentials={credentials} interactive={true} />
              <PropsRoute path="/tasks/create" component={TaskCreator} credentials={credentials} interactive={false} />
              <PropsRoute path="/tasks/:taskId/connect" component={InteractiveConnect} credentials={credentials} />
              <PropsRoute path="/tasks/:taskId?/:action?" component={TaskRedirect} credentials={credentials} />
              <PropsRoute path="/groups/:taskGroupId?/:groupSection?/:taskId?/:sectionId?/:runId?/:subSectionId?/:artifactId?" component={UnifiedInspector} credentials={credentials} />
              <PropsRoute path="/quickstart" component={QuickStart} credentials={credentials} />
              <PropsRoute path="/aws-provisioner/:workerType?/:currentTab?" component={AwsProvisioner} credentials={credentials} baseUrl="https://aws-provisioner.taskcluster.net/v1" provisionerId="aws-provisioner-v1" routeRoot="/aws-provisioner" />
              <PropsRoute path="/aws-provisioner-staging/:workerType?/:currentTab?" component={AwsProvisioner} credentials={credentials} baseUrl="https://provisioner-staging.herokuapp.com/v1" provisionerId="staging-aws" routeRoot="/aws-provisioner-staging" />
              <PropsRoute path="/auth/clients/:clientId?" component={ClientManager} credentials={credentials} />
              <PropsRoute path="/auth/roles/:roleId?" component={RoleManager} credentials={credentials} />
              <PropsRoute path="/auth/scopes/:selectedScope?/:selectedEntity?" component={ScopeInspector} credentials={credentials} />
              <PropsRoute path="/pulse-inspector" component={PulseInspector} credentials={credentials} />
              <PropsRoute path="/purge-caches" component={CachePurgeInspector} credentials={credentials} />
              <PropsRoute path="/index/artifacts/:namespace?/:namespaceTaskId?" component={IndexedArtifactBrowser} credentials={credentials} />
              <PropsRoute path="/index/:namespace?/:namespaceTaskId?" component={IndexBrowser} credentials={credentials} />
              <PropsRoute path="/hooks/:hookGroupId?/:hookId?" component={HooksManager} credentials={credentials} />
              <PropsRoute path="/secrets/:secretId?" component={SecretsManager} credentials={credentials} />
              <PropsRoute path="/diagnostics" component={Diagnostics} credentials={credentials} />
              <PropsRoute path="/credentials" component={CredentialsManager} credentials={credentials} />
              <PropsRoute path="/display" component={Displays} credentials={credentials} />
              <PropsRoute path="/shell" component={Shell} credentials={credentials} />
              <Route component={NotFound} />
            </Switch>
          </Grid>
        </div>
      </BrowserRouter>
    );
  }
}
