import React from 'react';
import { Route } from 'react-router-dom';
import SecretManager from './secretmanager';
import Layout from '../lib/Layout';

const Secrets = ({ match }) => (
  <Layout>
    <Route path={`${match.url}/:secretId?`} render={props => <SecretManager {...props} />} />
  </Layout>
);

export default Secrets;
