import React from 'react';
import { Route } from 'react-router-dom';
import IndexBrowser from '../indexbrowser';
import EntryView from './entryview';
import Layout from '../../lib/Layout';

const IndexArtifactBrowser = ({ match }) => (
  <Layout>
    <Route path={`${match.url}/:ns?`} render={props => <IndexBrowser entryView={EntryView} {...props} />} />
  </Layout>
);

export default IndexArtifactBrowser;
