import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {Router, hashHistory} from 'react-router';
import {createStore, applyMiddleware} from 'redux';
import reducers from './reducers';
import thunk from 'redux-thunk';
import routes from './routes';
import Layout from '../lib/Layout';
import './app.less';

const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);

ReactDOM.render((
  <Layout>
    <Provider store={createStoreWithMiddleware(reducers)}>
      <Router history={hashHistory} routes={routes} />
    </Provider>
  </Layout>
), document.getElementById('root'));
