import React from 'react';
import ScopeInspector from './scopeinspector';
import * as utils from '../../lib/utils';
import Layout from '../../lib/Layout';

const hashManager = utils.createHashManager({separator: '/'});

const AuthScopes = () => {
  return (
    <Layout>
      <ScopeInspector hashEntry={hashManager.root()} />
    </Layout>
  );
};

export default AuthScopes;
