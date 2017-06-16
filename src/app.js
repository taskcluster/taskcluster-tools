import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect
} from 'react-router-dom';
import asyncComponent from './asyncComponent';

const RedirectToTaskGroupInspector = ({ match }) => (
  <Redirect to={window.location.pathname.replace(match.url, '/task-group-inspector')} />
);

const LandingPage = asyncComponent(() => import('./landingpage').then(module => module.default));
const TaskInspector = asyncComponent(() => import('./task-inspector').then(module => module.default));
const TaskGroupInspector = asyncComponent(() => import('./task-group-inspector').then(module => module.default));
const TaskCreator = asyncComponent(() => import('./task-creator').then(module => module.default));
const QuickStart = asyncComponent(() => import('./quickstart').then(module => module.default));
const PurgeCaches = asyncComponent(() => import('./purge-caches').then(module => module.default));
const IndexArtifactBrowser = asyncComponent(() => import('./index-browser/artifacts').then(module => module.default));
const IndexBrowser = asyncComponent(() => import('./index-browser').then(module => module.default));
const Secrets = asyncComponent(() => import('./secrets').then(module => module.default));
const Login = asyncComponent(() => import('./login').then(module => module.default));
const Status = asyncComponent(() => import('./status').then(module => module.default));
const Diagnostics = asyncComponent(() => import('./diagnostics').then(module => module.default));
const Hooks = asyncComponent(() => import('./hooks').then(module => module.default));
const AuthRoles = asyncComponent(() => import('./auth/roles').then(module => module.default));
const AuthClients = asyncComponent(() => import('./auth/clients').then(module => module.default));
const AuthScopes = asyncComponent(() => import('./auth/scopes').then(module => module.default));
const PulseInspector = asyncComponent(() => import('./pulse-inspector').then(module => module.default));
const Credentials = asyncComponent(() => import('./credentials').then(module => module.default));
const AwsProvisioner = asyncComponent(() => import('./aws-provisioner').then(module => module.default));
const OneClickLoanerConnect = asyncComponent(() => import('./one-click-loaner/connect').then(module => module.default));
const OneClickLoaner = asyncComponent(() => import('./one-click-loaner').then(module => module.default));
const Shell = asyncComponent(() => import('./shell').then(module => module.default));
const Interactive = asyncComponent(() => import('./interactive').then(module => module.default));
const Display = asyncComponent(() => import('./display').then(module => module.default));

const App = () => (
  <Router>
    <Switch>
      <Route exact path="/" component={LandingPage} />
      <Route path="/task-inspector" component={TaskInspector} />
      <Route path="/task-group-inspector" component={TaskGroupInspector} />
      <Route path="/task-creator" component={TaskCreator} />
      <Route path="/quickstart" component={QuickStart} />
      <Route path="/purge-caches" component={PurgeCaches} />
      <Route path="/index/artifacts" component={IndexArtifactBrowser} />
      <Route path="/index" component={IndexBrowser} />
      <Route path="/secrets" component={Secrets} />
      <Route path="/login" component={Login} />
      <Route path="/status" component={Status} />
      <Route path="/diagnostics" component={Diagnostics} />
      <Route path="/hooks" component={Hooks} />
      <Route path="/auth/roles" component={AuthRoles} />
      <Route path="/auth/clients" component={AuthClients} />
      <Route path="/auth/scopes" component={AuthScopes} />
      <Route path="/pulse-inspector" component={PulseInspector} />
      <Route path="/credentials" component={Credentials} />
      <Route path="/aws-provisioner" component={AwsProvisioner} />
      <Route path="/one-click-loaner/connect" component={OneClickLoanerConnect} />
      <Route path="/one-click-loaner" component={OneClickLoaner} />
      <Route path="/shell" component={Shell} />
      <Route path="/interactive" component={Interactive} />
      <Route path="/display" component={Display} />

      {/* Redirects */}
      <Route path="/task-graph-inspector" component={RedirectToTaskGroupInspector} />
      <Route path="/push-inspector" component={RedirectToTaskGroupInspector} />
    </Switch>
  </Router>
);

export default App;
