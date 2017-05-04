import React from 'react';
import {Route} from 'react-router-dom';
import Connect from './connect';
import Layout from '../../lib/Layout';

const ConnectView = ({match}) => (
  <Layout>
    <Route path={`${match.url}/:taskId?`} render={(props) => <Connect {...props} />} />
  </Layout>
);

export default ConnectView;
