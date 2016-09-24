import React from 'react';
import ReactDOM from 'react-dom';
import PulseInspector from './pulseinspector';
import * as utils from '../lib/utils';
import Layout from '../lib/Layout';

const hashManager = utils.createHashManager({ separator: '&' });

ReactDOM.render((
  <Layout>
    <PulseInspector hashEntry={hashManager.root()} />
  </Layout>
), document.getElementById('root'));
