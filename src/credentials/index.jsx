import React from 'react';
import CredentialManager from './credentials';
import Layout from '../lib/Layout';

const Credentials = (props) => (
  <Layout>
    <CredentialManager {...props} />
  </Layout>
);

export default Credentials;
