import React from 'react';
import Clients from '../../components/Clients';
import ClientManager from './ClientManager';

const View = ({ credentials, match, history, location }) => {
  const clientId = match.params.clientId || location.hash.slice(1);

  return (
    <Clients credentials={credentials} Auth>
      {({ auth }) => (
        <ClientManager
          auth={auth}
          history={history}
          credentials={credentials}
          clientId={clientId ? decodeURIComponent(clientId) : ''} />
      )}
    </Clients>
  );
};

export default View;
