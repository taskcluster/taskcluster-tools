import React from 'react';
import {Route} from 'react-router-dom';
import WorkerTypeTable from './workertypetable';
import Layout from '../lib/Layout';

const PROVISIONER_ID = 'aws-provisioner-v1';

const awsProvisioner = ({match}) => (
  <Layout>
    <Route path={`${match.url}/:workerType?/:currentTab?`} render={props => (
      <WorkerTypeTable provisionerId={PROVISIONER_ID} {...props} />
    )} />
  </Layout>
);

export default awsProvisioner;
