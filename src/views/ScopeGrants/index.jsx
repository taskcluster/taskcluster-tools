import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import ScopeGrants from './ScopeGrants';

const View = ({ match, history }) => {
  const pattern = decodeURIComponent(match.params.pattern || '');
  const organization = decodeURIComponent(match.params.organization || '');

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
              organization={organization}
            />
          )}
        </WithClients>
      )}
    </WithUserSession>
  );
};

export default View;
