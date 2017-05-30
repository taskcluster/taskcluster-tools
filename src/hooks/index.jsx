import React from 'react';
import { Route } from 'react-router-dom';
import HookManager from './hookmanager';
import Layout from '../lib/Layout';

const Hooks = () => (
  <Layout>
    <Route path="/hooks/:hookGroupId?/:hookId?" render={props => <HookManager {...props} />} />
  </Layout>
);

export default Hooks;
