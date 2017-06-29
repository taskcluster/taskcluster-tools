import React from 'react';
import Clients from '../../components/Clients';
import RoleManager from './RoleManager';

const View = ({ credentials, history, match }) => {
  const roleId = match.params.roleId || location.hash.slice(1);

  return (
    <Clients credentials={credentials} Auth>
      {({ auth }) => (
        <RoleManager
          auth={auth}
          history={history}
          roleId={roleId ? decodeURIComponent(roleId) : ''} />
      )}
    </Clients>
  );
};

export default View;
