import React from 'react';
import Clients from '../../components/Clients';
import RoleManager from './RoleManager';

const View = ({ credentials, history, match }) => (
  <Clients credentials={credentials} Auth>
    {({ auth }) => (
      <RoleManager
        auth={auth}
        history={history}
        roleId={match.params.roleId ? decodeURIComponent(match.params.roleId) : ''} />
    )}
  </Clients>
);

export default View;
