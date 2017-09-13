import React from 'react';
import { Redirect } from 'react-router-dom';
import Clients from '../../components/Clients';
import RoleManager from './RoleManager';

const View = ({ userSession, history, match }) => {
  const roleId = location.hash.slice(1);

  if (roleId) {
    return <Redirect to={`/auth/roles/${roleId}`} />;
  }

  return (
    <Clients userSession={userSession} Auth>
      {({ auth }) => (
        <RoleManager
          auth={auth}
          history={history}
          userSession={userSession}
          roleId={match.params.roleId ? decodeURIComponent(match.params.roleId) : ''} />
      )}
    </Clients>
  );
};

export default View;
