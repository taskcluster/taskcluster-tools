import React from 'react';
import { Helmet, title } from 'react-helmet';

const HelmetTitle = ({ title }) => (
  <Helmet>
    <title>{`${title} | TaskCluster`}</title>
  </Helmet>
);

export default HelmetTitle;
