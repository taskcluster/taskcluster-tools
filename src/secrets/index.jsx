import React from 'react';
import {Route} from 'react-router-dom';
import SecretManager from './secretmanager';
import Layout from '../lib/Layout';

const Secrets = () => (
  <Layout>
    <Route path="/secret" render={(props) => <SecretManager {...props} />} />
  </Layout>
);

export default Secrets;
