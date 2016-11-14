import React from 'react';
import ReactDOM from 'react-dom';
import ExchangeInspector from './exchangeinspector';
import * as utils from '../lib/utils';
import Layout from '../lib/Layout';

const hashManager = utils.createHashManager({separator: '/'});

ReactDOM.render((
  <Layout>
    <ExchangeInspector hashEntry={hashManager.root()} />
  </Layout>
), document.getElementById('root'));

