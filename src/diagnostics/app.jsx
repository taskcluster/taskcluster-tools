import React from 'react';
import ReactDOM from 'react-dom';
import Diagnostics from './diagnostics';
import Layout from '../lib/Layout';

ReactDOM.render((
  <Layout>
    <Diagnostics />
  </Layout>
), document.getElementById('root'));
