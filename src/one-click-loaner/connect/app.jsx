import React from 'react';
import ReactDOM from 'react-dom';
import * as utils from '../../lib/utils';
import Connect from './connect';
import Layout from '../../lib/Layout';

const hashManager = utils.createHashManager({separator: '/'});

ReactDOM.render((
  <Layout>
    <Connect hashEntry={hashManager.root()} />
  </Layout>
), document.getElementById('root'));
