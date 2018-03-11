import { Redirect } from 'react-router-dom';
import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import ClientManager from './ClientManager';

const View = ({ match, history, location }) => {
  const clientId = location.hash.slice(1);

  if (clientId) {
    return <Redirect to={`/auth/clients/${clientId}`} />;
  }

  return (
    <WithUserSession>
      {userSession => (
        <WithClients Auth>
          {clients => (
            <ClientManager
              {...clients}
              userSession={userSession}
              history={history}
              clientId={
                match.params.clientId
                  ? decodeURIComponent(match.params.clientId)
                  : ''
              }
            />
          )}
        </WithClients>
      )}
    </WithUserSession>
  );
};

export default View;
