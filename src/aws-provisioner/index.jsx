import React from 'react';
import {Route} from 'react-router-dom';
import WorkerTypeTable from './workertypetable';
import Layout from '../lib/Layout';

const PROVISIONER_ID = 'aws-provisioner-v1';

const awsProvisioner = () => (
  <Layout>
    <Route path="/aws-provisioner/:workerType?/:currentTab?" render={props => (
      <WorkerTypeTable provisionerId={PROVISIONER_ID} {...props} />
    )} />
  </Layout>
);

export default awsProvisioner;
