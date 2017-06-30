import React from 'react';
import { Redirect } from 'react-router-dom';
import Clients from '../../components/Clients';
import ClientManager from './ClientManager';

const View = ({ credentials, match, history, location }) => {
  const clientId = location.hash.slice(1);

  if (clientId) {
    return <Redirect to={`/auth/clients/${clientId}`} />;
  }

  return (
    <Clients credentials={credentials} Auth>
      {({ auth }) => (
        <ClientManager
          auth={auth}
          history={history}
          credentials={credentials}
          clientId={match.params.clientId ? decodeURIComponent(match.params.clientId) : ''} />
      )}
    </Clients>
  );
};

export default View;
