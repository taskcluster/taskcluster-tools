import WithUserSession from '../../components/WithUserSession';
import CredentialsManager from './CredentialsManager';

const View = () => (
  <WithUserSession>
    {userSession => <CredentialsManager userSession={userSession} />}
  </WithUserSession>
);

export default View;
