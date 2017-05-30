import React from 'react';
import { Route } from 'react-router-dom';
import OneClickLoaner from './one-click-loaner';
import Layout from '../lib/Layout';

const OneClickLoanerView = ({ match }) => (
  <Layout>
    <Route path={`${match.url}/:taskId?`} render={props => <OneClickLoaner {...props} />} />
  </Layout>
);

export default OneClickLoanerView;
