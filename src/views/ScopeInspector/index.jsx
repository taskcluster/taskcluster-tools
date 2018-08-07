import { Redirect } from 'react-router-dom';
import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import ScopeInspector from './ScopeInspector';

const View = ({ match, history }) => {
  const [scope, entity] = window.location.hash.slice(1).split('/');

  if (scope && entity) {
    return <Redirect to={`/auth/scopes/${scope}/${entity}`} />;
  } else if (scope) {
    return <Redirect to={`/auth/scopes/${scope}`} />;
  }

  const selectedScope = decodeURIComponent(match.params.selectedScope || '');
  const selectedEntity = decodeURIComponent(match.params.selectedEntity || '');

  return (
    <WithUserSession>
      {userSession => (
        <WithClients Auth>
          {clients => (
            <ScopeInspector
              {...clients}
              userSession={userSession}
              history={history}
              selectedScope={selectedScope}
              selectedEntity={selectedEntity}
            />
          )}
        </WithClients>
      )}
    </WithUserSession>
  );
};

export default View;
