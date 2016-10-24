import React from 'react';
import ReactDOM from 'react-dom';
import {TaskClusterDashboard} from './status';
import Layout from '../lib/Layout';

ReactDOM.render((
  <Layout>
    <TaskClusterDashboard />
  </Layout>
), document.getElementById('root'));
