import { Redirect } from 'react-router-dom';
import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import RoleManager from './RoleManager';

const View = ({ history, match }) => {
  const roleId = window.location.hash.slice(1);

  if (roleId) {
    return <Redirect to={`/auth/roles/${roleId}`} />;
  }

  return (
    <WithUserSession>
      {userSession => (
        <WithClients Auth>
          {clients => (
            <RoleManager
              {...clients}
              userSession={userSession}
              history={history}
              roleId={
                match.params.roleId
                  ? decodeURIComponent(match.params.roleId)
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
