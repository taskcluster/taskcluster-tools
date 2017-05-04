import React from 'react';
import {Route} from 'react-router-dom';
import PulseInspector from './pulseinspector';
import Layout from '../lib/Layout';

const PulseInspectorView = ({match}) => (
  <Layout>
    <Route path={`${match.url}`} render={props => <PulseInspector {...props} />} />
  </Layout>
);

export default PulseInspectorView;
