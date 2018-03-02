import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import ScopesetExpander from './ScopesetExpander';

const View = () => (
  <WithUserSession>
    {userSession => (
      <WithClients Auth>
        {clients => <ScopesetExpander {...clients} userSession={userSession} />}
      </WithClients>
    )}
  </WithUserSession>
);

export default View;
