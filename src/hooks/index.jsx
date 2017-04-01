import React from 'react';
import HookManager from './hookmanager';
import Layout from '../lib/Layout';
import {Route} from 'react-router-dom';

const Hooks = () => (
  <Layout>
    <Route path="/hooks/:hookGroupId?/:hookId?" render={(props) => <HookManager {...props} />} />
  </Layout>
);

export default Hooks;
