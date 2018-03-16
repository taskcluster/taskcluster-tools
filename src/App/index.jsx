import { Component } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { object } from 'prop-types';
import { Helmet, link } from 'react-helmet';
import { Grid } from 'react-bootstrap';
import PropsRoute from '../components/PropsRoute';
import Navigation from '../components/Navigation';
import NotFound from '../components/NotFound';
import { loadable } from '../utils';
import './styles.css';
import iconUrl from '../taskcluster.png';
import LegacyRedirect from './LegacyRedirect';
import Spinner from '../components/Spinner';
import AuthController from '../auth/AuthController';

const Home = loadable(() =>
  import(/* webpackChunkName: 'Home' */ '../views/Home')
);
const TaskCreator = loadable(() =>
  import(/* webpackChunkName: 'TaskCreator' */ '../views/TaskCreator')
);
const TaskRedirect = loadable(() =>
  import(/* webpackChunkName: 'TaskRedirect' */ '../views/TaskRedirect')
);
const UnifiedInspector = loadable(() =>
  import(/* webpackChunkName: 'UnifiedInspector' */ '../views/UnifiedInspector')
);
const QuickStart = loadable(() =>
  import(/* webpackChunkName: 'QuickStart' */ '../views/QuickStart')
);
const AwsProvisioner = loadable(() =>
  import(/* webpackChunkName: 'AwsProvisioner' */ '../views/AwsProvisioner')
);
const AwsProvisionerErrors = loadable(() =>
  import(/* webpackChunkName: 'AwsProvisionerErrors' */ '../views/AwsProvisionerErrors')
);
const WorkerTypes = loadable(() =>
  import(/* webpackChunkName: 'WorkerTypes' */ '../views/WorkerTypes')
);
const WorkerManager = loadable(() =>
  import(/* webpackChunkName: 'WorkerManager' */ '../views/WorkerManager')
);
const Workers = loadable(() =>
  import(/* webpackChunkName: 'Workers' */ '../views/Workers')
);
const Provisioners = loadable(() =>
  import(/* webpackChunkName: 'Provisioners' */ '../views/Provisioners')
);
const ClientManager = loadable(() =>
  import(/* webpackChunkName: 'ClientManager' */ '../views/ClientManager')
);
const RoleManager = loadable(() =>
  import(/* webpackChunkName: 'RoleManager' */ '../views/RoleManager')
);
const ScopeInspector = loadable(() =>
  import(/* webpackChunkName: 'ScopeInspector' */ '../views/ScopeInspector')
);
const ScopeGrants = loadable(() =>
  import(/* webpackChunkName: 'ScopeGrants' */ '../views/ScopeGrants')
);
const ScopesetExpander = loadable(() =>
  import(/* webpackChunkName: 'ScopesetExpander' */ '../views/ScopesetExpander')
);
const PulseInspector = loadable(() =>
  import(/* webpackChunkName: 'PulseInspector' */ '../views/PulseInspector')
);
const CachePurgeInspector = loadable(() =>
  import(/* webpackChunkName: 'CachePurgeInspector' */ '../views/CachePurgeInspector')
);
const IndexBrowser = loadable(() =>
  import(/* webpackChunkName: 'IndexBrowser' */ '../views/IndexBrowser')
);
const HooksManager = loadable(() =>
  import(/* webpackChunkName: 'HooksManager' */ '../views/HooksManager')
);
const SecretsManager = loadable(() =>
  import(/* webpackChunkName: 'SecretsManager' */ '../views/SecretsManager')
);
const Diagnostics = loadable(() =>
  import(/* webpackChunkName: 'Diagnostics' */ '../views/Diagnostics')
);
const CredentialsManager = loadable(() =>
  import(/* webpackChunkName: 'CredentialsManager' */ '../views/CredentialsManager')
);
const Displays = loadable(() =>
  import(/* webpackChunkName: 'Displays' */ '../views/Displays')
);
const Shell = loadable(() =>
  import(/* webpackChunkName: 'Shell' */ '../views/Shell')
);
const InteractiveConnect = loadable(() =>
  import(/* webpackChunkName: 'InteractiveConnect' */ '../views/InteractiveConnect')
);
const Auth0Login = loadable(() =>
  import(/* webpackChunkName: 'Auth0Login' */ '../views/Auth0Login')
);
const DevelopmentLogin = loadable(() =>
  import(/* webpackChunkName: 'DevelopmentLogin' */ '../views/DevelopmentLogin')
);
const ManualLogin = loadable(() =>
  import(/* webpackChunkName: 'ManualLogin' */ '../views/ManualLogin')
);
const ClientCreator = loadable(() =>
  import(/* webpackChunkName: 'ClientCreator' */ '../views/ClientCreator')
);

export default class App extends Component {
  static childContextTypes = {
    authController: object.isRequired
  };

  constructor(props) {
    super(props);

    this.authController = new AuthController();

    this.state = {
      authReady: false
    };
  }

  componentWillMount() {
    this.authController.on(
      'user-session-changed',
      this.handleUserSessionChanged
    );

    // we do not want to automatically load a user session on the login views; this is
    // a hack until they get an entry point of their own with no UI.
    if (!window.location.pathname.startsWith('/login')) {
      this.authController.loadUserSession();
    } else {
      this.setState({ authReady: true });
    }
  }

  componentWillUnmount() {
    this.authController.removeListener(
      'user-session-changed',
      this.handleUserSessionChanged
    );
  }

  getChildContext() {
    return {
      authController: this.authController
    };
  }

  handleUserSessionChanged = userSession => {
    // Consider auth "ready" when we have no userSession, a userSession with no
    // renewAfter, or a renewAfter that is not in the past.  Once auth is
    // ready, it never becomes non-ready again.
    const authReady =
      this.state.authReady ||
      !userSession ||
      !userSession.renewAfter ||
      new Date(userSession.renewAfter) > new Date();

    this.setState({ authReady });
  };

  render() {
    const { authReady } = this.state;
    const { authController } = this;

    return (
      <BrowserRouter>
        <div>
          <Helmet>
            <link rel="shortcut icon" type="image/png" href={iconUrl} />
          </Helmet>
          <PropsRoute component={Navigation} />
          <Grid fluid id="container">
            {authReady ? (
              <Switch>
                <PropsRoute
                  path="/index/artifacts"
                  component={LegacyRedirect}
                />
                <PropsRoute path="/task-inspector" component={LegacyRedirect} />
                <PropsRoute
                  path="/task-graph-inspector"
                  component={LegacyRedirect}
                />
                <PropsRoute
                  path="/task-group-inspector"
                  component={LegacyRedirect}
                />
                <PropsRoute path="/push-inspector" component={LegacyRedirect} />
                <PropsRoute
                  path="/one-click-loaner"
                  component={LegacyRedirect}
                />
                <PropsRoute path="/interactive" component={LegacyRedirect} />
                <PropsRoute path="/task-creator" component={LegacyRedirect} />

                <PropsRoute path="/" exact component={Home} />
                <PropsRoute
                  path="/tasks/create/interactive"
                  component={TaskCreator}
                  interactive
                />
                <PropsRoute
                  path="/tasks/create"
                  component={TaskCreator}
                  interactive={false}
                />
                <PropsRoute
                  path="/tasks/:taskId/connect"
                  component={InteractiveConnect}
                />
                <PropsRoute
                  path="/tasks/:taskId?/:action?"
                  component={TaskRedirect}
                />
                <PropsRoute
                  path="/groups/:taskGroupId?/:groupSection?/:taskId?/:sectionId?/:runId?/:subSectionId?/:artifactId?"
                  component={UnifiedInspector}
                />
                <PropsRoute path="/quickstart" component={QuickStart} />
                <PropsRoute
                  path="/aws-provisioner/recent-errors"
                  component={AwsProvisionerErrors}
                  provisionerId="aws-provisioner-v1"
                  ec2BaseUrl="https://ec2-manager.taskcluster.net/v1"
                />
                <PropsRoute
                  path="/aws-provisioner-staging/recent-errors"
                  component={AwsProvisionerErrors}
                  provisionerId="aws-provisioner-v1"
                  ec2BaseUrl="https://ec2-manager-staging.taskcluster.net/v1"
                />
                <PropsRoute
                  path="/aws-provisioner/:workerType?/:currentTab?"
                  component={AwsProvisioner}
                  baseUrl="https://aws-provisioner.taskcluster.net/v1"
                  ec2BaseUrl="https://ec2-manager.taskcluster.net/v1"
                  provisionerId="aws-provisioner-v1"
                  routeRoot="/aws-provisioner"
                />
                <PropsRoute
                  path="/aws-provisioner-staging/:workerType?/:currentTab?"
                  component={AwsProvisioner}
                  baseUrl="https://provisioner-staging.herokuapp.com/v1"
                  ec2BaseUrl="https://ec2-manager-staging.taskcluster.net/v1"
                  provisionerId="staging-aws"
                  routeRoot="/aws-provisioner-staging"
                />
                <PropsRoute
                  path="/provisioners/:provisionerId/worker-types/:workerType/workers/:workerGroup?/:workerId?"
                  component={WorkerManager}
                />
                <PropsRoute
                  path="/provisioners/:provisionerId/worker-types/:workerType"
                  component={Workers}
                />
                <PropsRoute
                  path="/provisioners/:provisionerId/worker-types"
                  component={WorkerTypes}
                />
                <PropsRoute
                  path="/provisioners/:provisionerId?"
                  component={Provisioners}
                />
                <PropsRoute
                  path="/auth/clients/new"
                  component={ClientCreator}
                />
                <PropsRoute
                  path="/auth/clients/:clientId?"
                  component={ClientManager}
                />
                <PropsRoute
                  path="/auth/roles/:roleId?"
                  component={RoleManager}
                />
                <PropsRoute
                  path="/auth/scopes/expansions"
                  component={ScopesetExpander}
                />
                <PropsRoute
                  path="/auth/scopes/:selectedScope?/:selectedEntity?"
                  component={ScopeInspector}
                />
                <PropsRoute
                  path="/auth/grants/:pattern?"
                  component={ScopeGrants}
                />
                <PropsRoute
                  path="/pulse-inspector"
                  component={PulseInspector}
                />
                <PropsRoute
                  path="/purge-caches"
                  component={CachePurgeInspector}
                />
                <PropsRoute
                  path="/index/:namespace?/:namespaceTaskId?"
                  component={IndexBrowser}
                />
                <PropsRoute
                  path="/hooks/:hookGroupId?/:hookId?"
                  component={HooksManager}
                />
                <PropsRoute
                  path="/secrets/:secretId?"
                  component={SecretsManager}
                />
                <PropsRoute path="/diagnostics" component={Diagnostics} />
                <PropsRoute
                  path="/credentials"
                  component={CredentialsManager}
                />
                <PropsRoute path="/display" component={Displays} />
                <PropsRoute path="/shell" component={Shell} />
                {authController.canSignInUsing('auth0') && (
                  <PropsRoute
                    path="/login/auth0"
                    component={Auth0Login}
                    setUserSession={authController.setUserSession}
                  />
                )}
                {authController.canSignInUsing('development') && (
                  <PropsRoute
                    path="/login/development"
                    component={DevelopmentLogin}
                    setUserSession={authController.setUserSession}
                  />
                )}
                {authController.canSignInUsing('manual') && (
                  <PropsRoute
                    path="/login/manual"
                    component={ManualLogin}
                    setUserSession={authController.setUserSession}
                  />
                )}
                <Route component={NotFound} />
              </Switch>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Spinner />
                <br />
                Authenticating...
              </div>
            )}
          </Grid>
        </div>
      </BrowserRouter>
    );
  }
}
