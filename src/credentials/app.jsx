import React from 'react';
import ReactDOM from 'react-dom';
import CredentialManager from './credentials';
import Layout from '../lib/Layout';

ReactDOM.render((
  <Layout>
    <CredentialManager />
  </Layout>
), document.getElementById('root'));
