import React from 'react';
import ReactDOM from 'react-dom';
import RoleManager from './rolemanager';
import * as utils from '../../lib/utils';
import Layout from '../../lib/Layout';

const hashManager = utils.createHashManager({separator: '/'});

ReactDOM.render((
  <Layout>
    <RoleManager hashEntry={hashManager.root()} />
  </Layout>
), document.getElementById('root'));
