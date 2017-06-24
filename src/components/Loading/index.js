import React from 'react';
import { bool, any } from 'prop-types';
import Spinner from '../Spinner';
import Error from '../Error';

export default class Loading extends React.PureComponent {
  static propTypes = {
    isLoading: bool,
    error: any,
    pastDelay: bool,
    timedOut: bool
  };

  render() {
    const { isLoading, timedOut, pastDelay, error } = this.props;

    if (isLoading) {
      return timedOut ?
        <div>timeout</div> :
        pastDelay ?
          <Spinner /> :
          null;
    }

    if (error) {
      return <Error error={error} />;
    }

    return null;
  }
}
