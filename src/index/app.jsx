import React from 'react';
import ReactDOM from 'react-dom';
import IndexBrowser from './indexbrowser';
import EntryView from './entryview';
import * as utils from '../lib/utils';
import Layout from '../lib/Layout';

const hashManager = utils.createHashManager({ separator: '/' });

ReactDOM.render((
  <Layout>
    <IndexBrowser hashEntry={hashManager.root()} entryView={EntryView} hasHashEntry={false} />
  </Layout>
), document.getElementById('root'));
