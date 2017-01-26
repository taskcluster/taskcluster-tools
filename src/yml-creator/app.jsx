import React from 'react';
import ReactDOM from 'react-dom';
import YmlCreator from './ymlcreator';
import * as utils from '../lib/utils';
import Layout from '../lib/Layout';

ReactDOM.render((
  <Layout>
    <YmlCreator />
  </Layout>
), document.getElementById('root'));
