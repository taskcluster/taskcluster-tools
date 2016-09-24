import React from 'react';
import { Route } from 'react-router';
import Listings from './containers/listings';
import TabsView from './containers/tabsView';
import PushInspector from './containers/pushInspector';

export default (
  <Route path="/" component={PushInspector}>
    <Route path=":taskGroupId" component={Listings}>
      <Route path=":taskId" component={TabsView} />
    </Route>
  </Route>
);
