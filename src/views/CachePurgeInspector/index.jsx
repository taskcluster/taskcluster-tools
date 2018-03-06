import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import CachePurgeInspector from './CachePurgeInspector';

const View = () => (
  <WithUserSession>
    {userSession => (
      <WithClients PurgeCache>
        {clients => (
          <CachePurgeInspector {...clients} userSession={userSession} />
        )}
      </WithClients>
    )}
  </WithUserSession>
);

export default View;
