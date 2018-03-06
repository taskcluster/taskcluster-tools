import { Redirect } from 'react-router-dom';
import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import HooksManager from './HooksManager';

const View = ({ match, history, location }) => {
  const [groupId, id, create] = location.hash.slice(1).split('/');

  if (groupId && id) {
    return <Redirect to={`/hooks/${groupId}/${id}`} />;
  } else if (groupId) {
    return <Redirect to={`/hooks/${groupId}`} />;
  } else if (create) {
    return <Redirect to="/hooks/create" />;
  }

  return (
    <WithUserSession>
      {userSession => (
        <WithClients Hooks>
          {clients => (
            <HooksManager
              {...clients}
              userSession={userSession}
              history={history}
              hookGroupId={
                match.params.hookGroupId &&
                decodeURIComponent(match.params.hookGroupId)
              }
              hookId={
                match.params.hookId && decodeURIComponent(match.params.hookId)
              }
            />
          )}
        </WithClients>
      )}
    </WithUserSession>
  );
};

export default View;
