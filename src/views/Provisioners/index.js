import React from 'react';
import Clients from '../../components/Clients';
import Provisioners from './Provisioners';

const View = ({ match, userSession }) => (
  <Clients userSession={userSession} Queue>
    {({ queue }) => (
      <Provisioners
        queue={queue}
        userSession={userSession}
        provisionerId={match.params.provisionerId || ''}
      />
    )}
  </Clients>
);

export default View;
