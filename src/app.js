import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect
} from 'react-router-dom';
import LandingPage from './landingpage';
import TaskInspector from './task-inspector';
import TaskGroupInspector from './task-group-inspector';
import TaskCreator from './task-creator';
import QuickStart from './quickstart';
import PurgeCaches from './purge-caches';
import IndexBrowser from './index-browser';
import IndexArtifactBrowser from './index-browser/artifacts';
import Secrets from './secrets';
import Login from './login';
import Status from './status';
import Diagnostics from './diagnostics';
import Hooks from './hooks';
import AuthRoles from './auth/roles';
import AuthClients from './auth/clients';
import AuthScopes from './auth/scopes';
import OneClickLoaner from './one-click-loaner';
import OneClickLoanerConnect from './one-click-loaner/connect';
import Credentials from './credentials';
import PulseInspector from './pulse-inspector';
import AwsProvisioner from './aws-provisioner';
import Interactive from './interactive';
import Shell from './shell';
import Display from './display';

const RedirectToTaskGroupInspector = ({match}) => (
  <Redirect to={window.location.pathname.replace(match.url, '/task-group-inspector')} />
);

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
      <Route path="/task-graph-inspector" component={RedirectToTaskGroupInspector}/>
      <Route path="/push-inspector" component={RedirectToTaskGroupInspector}/>
    </Switch>
  </Router>
);

export default App;
