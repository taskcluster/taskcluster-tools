import React from 'react';
import {Route} from 'react-router-dom';
import ClientManager from './clientmanager';
import Layout from '../../lib/Layout';

const AuthClients = ({match}) => {
  return (
    <Layout>
      <Route path={`${match.url}/:selectedClientId?`} render={(props) => <ClientManager {...props} />} />
    </Layout>
  );
};

export default AuthClients;
