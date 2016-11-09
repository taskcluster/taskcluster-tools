import React from 'react';
import ReactDOM from 'react-dom';
import OneClickLoaner from './one-click-loaner';
import * as utils from '../lib/utils';
import Layout from '../lib/Layout';

const hashManager = utils.createHashManager({separator: '/'});

ReactDOM.render((
  <Layout>
    <OneClickLoaner hashEntry={hashManager.root()} />
  </Layout>
), document.getElementById('root'));
