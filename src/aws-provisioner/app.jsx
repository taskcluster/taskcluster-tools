import React from 'react';
import ReactDOM from 'react-dom';
import * as utils from '../lib/utils';
import WorkerTypeTable from './workertypetable';
import Layout from '../lib/Layout';

const PROVISIONER_ID = 'aws-provisioner-v1';
const hashManager = utils.createHashManager({ separator: '/' });

ReactDOM.render((
  <Layout>
    <WorkerTypeTable provisionerId={PROVISIONER_ID} hashEntry={hashManager.root()} />
  </Layout>
), document.getElementById('root'));
