import React from 'react';
import { Route } from 'react-router-dom';
import RoleManager from './rolemanager';
import Layout from '../../lib/Layout';

const AuthRoles = ({ match }) => (
  <Layout>
    <Route path={`${match.url}/:roleId?`} render={props => <RoleManager {...props} />} />
  </Layout>
);

export default AuthRoles;
