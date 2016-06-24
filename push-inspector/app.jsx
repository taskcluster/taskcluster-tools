let React = require('react');
let ReactDOM = require('react-dom');
let $ = require('jquery');
let bs = require('react-bootstrap');
let utils = require('../lib/utils');
import Search from './containers/search';
import { Provider } from 'react-redux';
import { Router, Route, IndexRoute, hashHistory } from 'react-router';
import { createStore, applyMiddleware } from 'redux';
import reducers from './reducers';
import thunk from 'redux-thunk';
import routes from './routes';


let hashManager = utils.createHashManager({ separator: '/' });
const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);

// Render component
$(function() {
  ReactDOM.render(
    (
      <Provider store={createStoreWithMiddleware(reducers)}>
        <Router history={hashHistory} routes={routes} />
      </Provider>
    ),
    $('#container')[0]
  );
});
