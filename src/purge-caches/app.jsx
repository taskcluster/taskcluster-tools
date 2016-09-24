import React from 'react';
import ReactDOM from 'react-dom';
import CacheManager from './cachemanager';
import Layout from '../lib/Layout';

ReactDOM.render((
  <Layout>
    <CacheManager />
  </Layout>
), document.getElementById('root'));
