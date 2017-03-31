import React, {Component} from 'react';
import {Provider} from 'react-redux';
import {Route} from 'react-router-dom';
import {createStore, applyMiddleware} from 'redux';
import reducers from './reducers';
import thunk from 'redux-thunk';
import Layout from '../lib/Layout';
import './app.less';

import PushInspector from './containers/pushInspector';

const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);

const TaskGroupInspector = ({match}) => {
  return (
    <Layout>
      <Provider store={createStoreWithMiddleware(reducers)}>
        <div>
          <Route path={`${match.url}/:taskGroupId?/:taskId?/:run?/:section?`} render={(props) => <PushInspector {...props} />} />
        </div>
      </Provider>
    </Layout>
  );
};

export default TaskGroupInspector;
