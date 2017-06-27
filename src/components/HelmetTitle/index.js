import React from 'react';
import { Helmet, title } from 'react-helmet';

const HelmetTitle = props => (
  <Helmet>
    <title>{props.blank ? 'TaskCluster' : `${props.title} | TaskCluster`}</title>
  </Helmet>
);

export default HelmetTitle;
