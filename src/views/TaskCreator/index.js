import React from 'react';
import Clients from '../../components/Clients';
import TaskCreator from './TaskCreator';

const View = ({ credentials, history, location }) => (
  <Clients credentials={credentials} Queue>
    {({ queue }) => <TaskCreator queue={queue} history={history} location={location} />}
  </Clients>
);

export default View;
