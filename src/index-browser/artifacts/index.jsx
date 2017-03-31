import React from 'react';
import {Route} from 'react-router-dom';
import IndexBrowser from '../indexbrowser';
import EntryView from './entryview';
import Layout from '../../lib/Layout';

const IndexArtifactBrowser = () => (
  <Layout>
    <Route path={`/index/artifacts/:ns?`} render={(props) => <IndexBrowser entryView={EntryView} {...props} />} />
  </Layout>
);

export default IndexArtifactBrowser;
