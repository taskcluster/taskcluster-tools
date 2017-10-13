import React from 'react';
import Clients from '../../components/Clients';
import AuthNew from './AuthNew';

const View = ({ userSession, authController, location }) => (
  <Clients userSession={userSession} Auth>
    {({ auth }) => (
      <AuthNew
        location={location}
        auth={auth}
        authController={authController}
        userSession={userSession}
      />
    )}
  </Clients>
);

export default View;
