import React from 'react';
import Clients from '../../components/Clients';
import Provisioners from './Provisioners';

const View = ({ match }) => (
  <Clients Queue>
    {({ queue }) => (
      <Provisioners
        queue={queue}
        provisionerId={match.params.provisionerId || ''}
      />
    )}
  </Clients>
);

export default View;
