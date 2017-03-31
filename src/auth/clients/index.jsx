import React from 'react';
import ReactDOM from 'react-dom';
import ClientManager from './clientmanager';
import * as utils from '../../lib/utils';
import Layout from '../../lib/Layout';

const hashManager = utils.createHashManager({separator: '/'});

ReactDOM.render((
  <Layout>
    <ClientManager hashEntry={hashManager.root()} />
  </Layout>
), document.getElementById('root'));
