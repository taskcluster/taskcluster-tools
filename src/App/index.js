import React, { Component } from 'react';
import {
  BrowserRouter,
  Route,
  Switch,
  withRouter,
  Link
} from 'react-router-dom';
import { Helmet, link } from 'react-helmet';
import { Autocomplete, Button, FontIcon, NavigationDrawer } from 'react-md';
import NavItemLink from './NavItemLink';
import FontLoader from '../components/FontLoader';
import PropsRoute from '../components/PropsRoute';
import NotFound from '../components/NotFound';
import Spinner from '../components/Spinner';
import AccountMenu from './AccountMenu';
import Logo from './Logo';
import menuItems from './menuItems';
import AuthController from '../auth/AuthController';
import LegacyRedirect from './LegacyRedirect';
import { loadable } from '../utils';
import iconUrl from '../images/taskcluster.png';
import './app.scss';

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
const PulseInspector = loadable(() =>
  import(/* webpackChunkName: 'PulseInspector' */ '../views/PulseInspector')
);
const CachePurgeInspector = loadable(() =>
  import(/* webpackChunkName: 'CachePurgeInspector' */ '../views/CachePurgeInspector')
);
const IndexedArtifactBrowser = loadable(() =>
  import(/* webpackChunkName: 'IndexedArtifactBrowser' */ '../views/IndexedArtifactBrowser')
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
  constructor() {
    super();

    this.authController = new AuthController();

    this.state = {
      userSession: null,
      authReady: false
    };
  }

  componentWillMount() {
    this.authController.onUserSessionChanged(this.handleUserSessionChanged);

    // we do not want to automatically load a user session on the login views; this is
    // a hack until they get an entry point of their own with no UI.
    if (!window.location.pathname.startsWith('/login')) {
      this.authController.loadUserSession();
    } else {
      this.setState({ authReady: true });
    }
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

    this.setState({ userSession, authReady });
  };

  handleActionClick = () => {
    if (this.state.searching) {
      this.setState({ value: '' });
    } else {
      this.setState({ searching: true });
    }
  };

  render() {
    const { authReady, userSession } = this.state;
    const { authController } = this;
    const App = withRouter(() => (
      <NavigationDrawer
        navItems={menuItems.map((props, key) => (
          <NavItemLink {...props} key={`nav-${key}`} />
        ))}
        mobileDrawerType={NavigationDrawer.DrawerTypes.TEMPORARY}
        tabletDrawerType={NavigationDrawer.DrawerTypes.PERSISTENT}
        desktopDrawerType={NavigationDrawer.DrawerTypes.CLIPPED}
        drawerHeaderChildren={
          <div style={{ margin: '12px 8px', width: '100%' }}>
            <AccountMenu simplifiedMenu={false} />
          </div>
        }
        toolbarActions={
          <div>
            <Autocomplete
              id="documentation-search"
              placeholder="Search"
              inputClassName={
                'search__input search__input--visible search__input--active'
              }
              filter={null}
              data={[]}
              total={0}
              style={{ position: 'absolute', width: 80, right: 250 }}
              leftIcon={<FontIcon>search</FontIcon>}
              listClassName="search__results"
              value={'e9qa7fJkS1WjwU3w1Q4w7A'}
              sameWidth={false}
              simplifiedMenu={false}
              minBottom={20}
              fillViewportWidth={false}
              fillViewportHeight={false}
            />
            <Button icon onClick={this.handleActionClick}>
              feedback
            </Button>
            <Button icon onClick={this.handleActionClick}>
              help_outline
            </Button>
          </div>
        }
        toolbarTitle={
          <Link to="/">
            <Logo />
            <span
              style={{
                letterSpacing: 0,
                fontSize: 24,
                fontFamily: 'FiraSans500',
                color: '#f9f9fa'
              }}>
              &nbsp;&nbsp;Firefox CI
            </span>
          </Link>
        }
        contentId="main-content"
        persistentIcon={<FontIcon>menu</FontIcon>}
        contentClassName="md-grid">
        <div>
          <Helmet>
            <link rel="shortcut icon" type="image/png" href={iconUrl} />
          </Helmet>
          {authReady ? (
            <Switch>
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
              <PropsRoute path="/one-click-loaner" component={LegacyRedirect} />
              <PropsRoute path="/interactive" component={LegacyRedirect} />
              <PropsRoute path="/task-creator" component={LegacyRedirect} />
              <PropsRoute
                path="/"
                exact={true}
                component={Home}
                userSession={userSession}
              />
              <PropsRoute
                path="/tasks/create/interactive"
                component={TaskCreator}
                userSession={userSession}
                interactive={true}
              />
              <PropsRoute
                path="/tasks/create"
                component={TaskCreator}
                userSession={userSession}
                interactive={false}
              />
              <PropsRoute
                path="/tasks/:taskId/connect"
                component={InteractiveConnect}
                userSession={userSession}
              />
              <PropsRoute
                path="/tasks/:taskId?/:action?"
                component={TaskRedirect}
                userSession={userSession}
              />
              <PropsRoute
                path="/groups/:taskGroupId?/:groupSection?/:taskId?/:sectionId?/:runId?/:subSectionId?/:artifactId?"
                component={UnifiedInspector}
                userSession={userSession}
              />
              <PropsRoute
                path="/quickstart"
                component={QuickStart}
                userSession={userSession}
              />
              <PropsRoute
                path="/aws-provisioner/:workerType?/:currentTab?"
                component={AwsProvisioner}
                userSession={userSession}
                baseUrl="https://aws-provisioner.taskcluster.net/v1"
                provisionerId="aws-provisioner-v1"
                routeRoot="/aws-provisioner"
              />
              <PropsRoute
                path="/aws-provisioner-staging/:workerType?/:currentTab?"
                component={AwsProvisioner}
                userSession={userSession}
                baseUrl="https://provisioner-staging.herokuapp.com/v1"
                provisionerId="staging-aws"
                routeRoot="/aws-provisioner-staging"
              />
              <PropsRoute
                path="/provisioners/:provisionerId/worker-types/:workerType/workers/:workerGroup?/:workerId?"
                component={WorkerManager}
                userSession={userSession}
              />
              <PropsRoute
                path="/provisioners/:provisionerId/worker-types/:workerType"
                component={Workers}
                userSession={userSession}
              />
              <PropsRoute
                path="/provisioners/:provisionerId/worker-types"
                component={WorkerTypes}
                userSession={userSession}
              />
              <PropsRoute
                path="/provisioners/:provisionerId?"
                component={Provisioners}
              />
              <PropsRoute
                path="/auth/clients/new"
                component={ClientCreator}
                authController={authController}
                userSession={userSession}
              />
              <PropsRoute
                path="/auth/clients/:clientId?"
                component={ClientManager}
                userSession={userSession}
              />
              <PropsRoute
                path="/auth/roles/:roleId?"
                component={RoleManager}
                userSession={userSession}
              />
              <PropsRoute
                path="/auth/scopes/:selectedScope?/:selectedEntity?"
                component={ScopeInspector}
                userSession={userSession}
              />
              <PropsRoute
                path="/auth/grants/:pattern?"
                component={ScopeGrants}
                userSession={userSession}
              />
              <PropsRoute
                path="/pulse-inspector"
                component={PulseInspector}
                userSession={userSession}
              />
              <PropsRoute
                path="/purge-caches"
                component={CachePurgeInspector}
                userSession={userSession}
              />
              <PropsRoute
                path="/index/artifacts/:namespace?/:namespaceTaskId?"
                component={IndexedArtifactBrowser}
                userSession={userSession}
              />
              <PropsRoute
                path="/index/:namespace?/:namespaceTaskId?"
                component={IndexBrowser}
                userSession={userSession}
              />
              <PropsRoute
                path="/hooks/:hookGroupId?/:hookId?"
                component={HooksManager}
                userSession={userSession}
              />
              <PropsRoute
                path="/secrets/:secretId?"
                component={SecretsManager}
                userSession={userSession}
              />
              <PropsRoute
                path="/diagnostics"
                component={Diagnostics}
                userSession={userSession}
              />
              <PropsRoute
                path="/credentials"
                component={CredentialsManager}
                userSession={userSession}
              />
              <PropsRoute
                path="/display"
                component={Displays}
                userSession={userSession}
              />
              <PropsRoute
                path="/shell"
                component={Shell}
                userSession={userSession}
              />
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
        </div>
      </NavigationDrawer>
    ));

    return (
      <div>
        <FontLoader />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </div>
    );
  }
}
