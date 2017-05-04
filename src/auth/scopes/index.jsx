import React from 'react';
import ScopeInspector from './scopeinspector';
import {Route} from 'react-router-dom';
import Layout from '../../lib/Layout';

const AuthScopes = ({match}) => (
  <Layout>
    <Route path={`${match.url}/:selectedScope?/:selectedEntity?`} render={props => <ScopeInspector {...props} />} />
  </Layout>
);

export default AuthScopes;
