import React from 'react';
import ReactDOM from 'react-dom';
import ScopeInspector from './scopeinspector';
import * as utils from '../../lib/utils';
import Layout from '../../lib/Layout';

const hashManager = utils.createHashManager({ separator: '/' });

ReactDOM.render((
  <Layout>
    <ScopeInspector hashEntry={hashManager.root()} />
  </Layout>
), document.getElementById('root'));
