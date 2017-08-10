import React from 'react';
import { Redirect } from 'react-router-dom';
import Clients from '../../components/Clients';
import WorkerTypeTable from './WorkerTypeTable';

const View = ({ credentials, match, history, location }) => {
  const [worker, tab] = location.hash.slice(1).split('/');

  if (worker && tab) {
    return <Redirect to={`/aws-provisioner-staging/${worker}/${tab}`} />;
  } else if (worker) {
    return <Redirect to={`/aws-provisioner-staging/${worker}`} />;
  }

  return (
    <Clients credentials={credentials} Queue AwsProvisioner={{ baseUrl: 'https://provisioner-staging.herokuapp.com/v1/' }}>
      {clients => (
        <WorkerTypeTable
          {...clients}
          history={history}
          provisionerId="staging-aws"
          workerType={match.params.workerType}
          currentTab={match.params.currentTab} />
      )}
    </Clients>
  );
};

export default View;
