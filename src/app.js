import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch
} from 'react-router-dom';
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
// import AuthScopes from './auth/scopes';
// import OneClickLoaner from './one-click-loaner';
// import OneClickLoanerConnect from './one-click-loaner/connect';
// import Credentials from './credentials';
import PulseInspector from './pulse-inspector';
// import Interactive from './interactive';
// import OneClickLoaner from './one-click-loaner';
// import Shell from './shell';
// import AwsProvisioner from './aws-provisioner';

import LandingPage from './landingpage';


const App = () => {
  return (
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
        <Route path="/secret" component={Secrets} />
        <Route path="/login" component={Login} />
        <Route path="/status" component={Status} />
        <Route path="/diagnostics" component={Diagnostics} />
        <Route path="/hooks" component={Hooks} />
        <Route path="/auth/roles" component={AuthRoles} />
        <Route path="/auth/clients" component={AuthClients} />
        {/*<Route path="/auth/scopes" component={AuthScopes} />*/}
        <Route path="/pulse-inspector" component={PulseInspector} />
        {/*<Route path="/one-click-loaner/connect" component={OneClickLoanerConnect} />*/}
        {/*<Route path="/one-click-loaner" component={OneClickLoaner} />*/}
        {/*<Route path="/credentials" component={Credentials} />*/}
        {/*<Route path="/awsprovisioner" component={AwsProvisioner} />*/}
        {/*<Route path="/shell" component={Shell} />*/}
        {/*<Route path="/interactive" component={Interactive} />*/}
      </Switch>
    </Router>
  )
};

export default App;
