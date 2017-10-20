import React from 'react';
import Clients from '../../components/Clients';
import ClientCreator from './ClientCreator';

const View = ({ userSession, authController, location }) => (
  <Clients userSession={userSession} Auth>
    {({ auth }) => (
      <ClientCreator
        location={location}
        auth={auth}
        authController={authController}
        userSession={userSession}
      />
    )}
  </Clients>
);

export default View;
