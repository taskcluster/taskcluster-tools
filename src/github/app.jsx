import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, hashHistory } from 'react-router';
import Github from './github';
import Layout from '../lib/Layout';

ReactDOM.render((
  <Layout>
    <Router history={hashHistory}>
      <Route path="/" component={Github}>
        <Route path=":organization" component={Github}>
          <Route path=":repository" component={Github}>
            <Route path=":sha" component={Github}/>
          </Route>
        </Route>
      </Route>
    </Router>
  </Layout>
), document.getElementById('root'));
