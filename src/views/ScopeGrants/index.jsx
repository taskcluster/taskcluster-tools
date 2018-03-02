import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import ScopeGrants from './ScopeGrants';

const View = ({ match, history }) => {
  const pattern = decodeURIComponent(match.params.pattern || '');

  return (
    <WithUserSession>
      {userSession => (
        <WithClients Auth>
          {clients => (
            <ScopeGrants
              {...clients}
              history={history}
              userSession={userSession}
              pattern={pattern}
            />
          )}
        </WithClients>
      )}
    </WithUserSession>
  );
};

export default View;
