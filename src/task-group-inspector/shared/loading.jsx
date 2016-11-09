import React from 'react';
import * as format from '../../lib/format';

const Loading = () => (
  <div className="spinner">
    <format.Icon name="spinner" size="2x" spin={true} />
  </div>
);

Loading.displayName = 'Loading';

export default Loading;
