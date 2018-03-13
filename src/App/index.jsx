import { Component } from 'react';
import { BrowserRouter, Route, Link, Switch } from 'react-router-dom';
import { object } from 'prop-types';
import { Grid } from 'react-bootstrap';
import PropsRoute from '../components/PropsRoute';
import Navigation from '../components/Navigation';
import NotFound from '../components/NotFound';
import SchemaTable from '../components/SchemaTable';
import { loadable } from '../utils';
import './styles.css';
import LegacyRedirect from './LegacyRedirect';
import Spinner from '../components/Spinner';
import AuthController from '../auth/AuthController';

const markdownProps = {
  renderers: {
    link: function RouterLink(props) {
      return props.href.match(/^(https?:)?\/\//) ? (
        <a href={props.href}>{props.children}</a>
      ) : (
        <Link to={props.href}>{props.children}</Link>
      );
    },
    html: function HtmlFormatter(props) {
      const parser = new DOMParser();
      const tree = parser.parseFromString(props.value, 'text/html');
      const node = tree.querySelector('div[data-render-schema]');

      if (node) {
        const url = node.dataset.renderSchema;

        return <SchemaTable url={url} />;
      }

      return props.value;
    }
  }
};
/*
* Tools
*/
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
const AwsProvisionerHealth = loadable(() =>
  import(/* webpackChunkName: 'AwsProvisionerHealth' */ '../views/AwsProvisionerHealth')
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
/*
* Docs
*/
const Api = loadable(() =>
  import(/* webpackChunkName: 'Api' */ '../docs/tutorial/apis')
);
const Authenticate = loadable(() =>
  import(/* webpackChunkName: 'Authenticate' */ '../docs/tutorial/authenticate')
);
const CreateTaskViaApi = loadable(() =>
  import(/* webpackChunkName: 'CreateTaskViaApi' */ '../docs/tutorial/create-task-via-api')
);
const DebugTask = loadable(() =>
  import(/* webpackChunkName: 'DebugTask' */ '../docs/tutorial/debug-task')
);
const DownloadTaskArtifacts = loadable(() =>
  import(/* webpackChunkName: 'DownloadTaskArtifacts' */ '../docs/tutorial/download-task-artifacts')
);
const FindingTasks = loadable(() =>
  import(/* webpackChunkName: 'FindingTasks' */ '../docs/tutorial/finding-tasks')
);
const GeckoDecisionTask = loadable(() =>
  import(/* webpackChunkName: 'GeckoDecisionTask' */ '../docs/tutorial/gecko-decision-task')
);
const GeckoDockerImages = loadable(() =>
  import(/* webpackChunkName: 'GeckoDockerImages' */ '../docs/tutorial/gecko-docker-images')
);
const GeckoNewJob = loadable(() =>
  import(/* webpackChunkName: 'GeckoNewJob' */ '../docs/tutorial/gecko-new-job')
);
const GeckoTaskGraph = loadable(() =>
  import(/* webpackChunkName: 'GeckoTaskGraph' */ '../docs/tutorial/gecko-task-graph')
);
const GeckoTaskGraphHowTo = loadable(() =>
  import(/* webpackChunkName: 'GeckoTaskGraphHowTo' */ '../docs/tutorial/gecko-task-graph-howto')
);
const GeckoTasks = loadable(() =>
  import(/* webpackChunkName: 'GeckoTasks' */ '../docs/tutorial/gecko-tasks')
);
const HackTc = loadable(() =>
  import(/* webpackChunkName: 'HackTc' */ '../docs/tutorial/hack-tc')
);
const HelloWorld = loadable(() =>
  import(/* webpackChunkName: 'HelloWorld' */ '../docs/tutorial/hello-world')
);
const MonitorTaskStatus = loadable(() =>
  import(/* webpackChunkName: 'MonitorTaskStatus' */ '../docs/tutorial/monitor-task-status')
);
const Reviews = loadable(() =>
  import(/* webpackChunkName: 'Reviews' */ '../docs/tutorial/reviews')
);
const WhatIsTc = loadable(() =>
  import(/* webpackChunkName: 'WhatIsTc' */ '../docs/tutorial/what-is-tc')
);
const Tutorial = loadable(() =>
  import(/* webpackChunkName: 'Tutorial' */ '../docs/tutorial')
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
                  path="/aws-provisioner/aws-health"
                  component={AwsProvisionerHealth}
                  ec2BaseUrl="https://ec2-manager.taskcluster.net/v1"
                />
                <PropsRoute
                  path="/aws-provisioner-staging/aws-health"
                  component={AwsProvisionerHealth}
                  ec2BaseUrl="https://ec2-manager-staging.taskcluster.net/v1"
                />
                <PropsRoute
                  path="/aws-provisioner/:workerType?/:currentTab?"
                  component={AwsProvisioner}
                  provisionerId="aws-provisioner-v1"
                  routeRoot="/aws-provisioner"
                />
                <PropsRoute
                  path="/aws-provisioner-staging/:workerType?/:currentTab?"
                  component={AwsProvisioner}
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
                <PropsRoute
                  path="/docs/tutorial/apis"
                  component={Api}
                  {...markdownProps}
                />
                <PropsRoute
                  path="/docs/tutorial/authenticate"
                  component={Authenticate}
                  {...markdownProps}
                />
                <PropsRoute
                  path="/docs/tutorial/create-task-via-api"
                  component={CreateTaskViaApi}
                  {...markdownProps}
                />
                <PropsRoute
                  path="/docs/tutorial/debug-task"
                  component={DebugTask}
                  {...markdownProps}
                />
                <PropsRoute
                  path="/docs/tutorial/download-task-artifacts"
                  component={DownloadTaskArtifacts}
                  {...markdownProps}
                />
                <PropsRoute
                  path="/docs/tutorial/finding-tasks"
                  component={FindingTasks}
                  {...markdownProps}
                />
                <PropsRoute
                  path="/docs/tutorial/gecko-decision-task"
                  component={GeckoDecisionTask}
                  {...markdownProps}
                />
                <PropsRoute
                  path="/docs/tutorial/gecko-docker-images"
                  component={GeckoDockerImages}
                  {...markdownProps}
                />
                <PropsRoute
                  path="/docs/tutorial/gecko-new-job"
                  component={GeckoNewJob}
                  {...markdownProps}
                />
                <PropsRoute
                  path="/docs/tutorial/gecko-task-graph"
                  component={GeckoTaskGraph}
                  {...markdownProps}
                />
                <PropsRoute
                  path="/docs/tutorial/gecko-task-graph-howto"
                  component={GeckoTaskGraphHowTo}
                  {...markdownProps}
                />
                <PropsRoute
                  path="/docs/tutorial/gecko-tasks"
                  component={GeckoTasks}
                  {...markdownProps}
                />
                <PropsRoute
                  path="/docs/tutorial/hack-tc"
                  component={HackTc}
                  {...markdownProps}
                />
                <PropsRoute
                  path="/docs/tutorial/hello-world"
                  component={HelloWorld}
                  {...markdownProps}
                />
                <PropsRoute
                  path="/docs/tutorial/monitor-task-status"
                  component={MonitorTaskStatus}
                  {...markdownProps}
                />
                <PropsRoute
                  path="/docs/tutorial/reviews"
                  component={Reviews}
                  {...markdownProps}
                />
                <PropsRoute
                  path="/docs/tutorial/what-is-tc"
                  component={WhatIsTc}
                  {...markdownProps}
                />
                <PropsRoute
                  path="/docs/tutorial"
                  component={Tutorial}
                  {...markdownProps}
                />
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
