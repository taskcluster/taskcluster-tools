import React from 'react';
import Clients from '../../components/Clients';
import ScopeGrants from './ScopeGrants';

const View = ({ userSession, match, history }) => {
  const pattern = decodeURIComponent(match.params.pattern || '');

  return (
    <Clients userSession={userSession} Auth>
      {({ auth }) => (
        <ScopeGrants
          auth={auth}
          history={history}
          userSession={userSession}
          pattern={pattern}
        />
      )}
    </Clients>
  );
};

export default View;
