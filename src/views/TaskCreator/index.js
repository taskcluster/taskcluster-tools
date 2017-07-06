import React from 'react';
import Clients from '../../components/Clients';
import TaskCreator from './TaskCreator';

const View = ({ credentials, history, location, interactive }) => (
  <Clients credentials={credentials} Queue>
    {({ queue }) => <TaskCreator queue={queue} history={history} location={location} interactive={interactive} />}
  </Clients>
);

export default View;
