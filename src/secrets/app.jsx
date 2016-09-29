import React from 'react';
import ReactDOM from 'react-dom';
import SecretManager from './secretmanager';
import Layout from '../lib/Layout';

ReactDOM.render((
  <Layout>
    <SecretManager />
  </Layout>
), document.getElementById('root'));
