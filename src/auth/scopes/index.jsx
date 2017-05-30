import React from 'react';
import { Route } from 'react-router-dom';
import ScopeInspector from './scopeinspector';
import Layout from '../../lib/Layout';

const AuthScopes = ({ match }) => (
  <Layout>
    <Route path={`${match.url}/:selectedScope?/:selectedEntity?`} render={props => <ScopeInspector {...props} />} />
  </Layout>
);

export default AuthScopes;
