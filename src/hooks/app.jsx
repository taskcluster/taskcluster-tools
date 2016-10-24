import React from 'react';
import ReactDOM from 'react-dom';
import HookManager from './hookmanager';
import * as utils from '../lib/utils';
import Layout from '../lib/Layout';

const hashManager = utils.createHashManager({separator: '/'});

ReactDOM.render((
  <Layout>
    <HookManager hashEntry={hashManager.root()} />
  </Layout>
), document.getElementById('root'));
