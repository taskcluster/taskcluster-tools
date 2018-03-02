import { PureComponent } from 'react';
import { bool, any } from 'prop-types';
import Spinner from '../Spinner';
import Error from '../Error';

export default class Loading extends PureComponent {
  static propTypes = {
    isLoading: bool,
    error: any,
    pastDelay: bool,
    timedOut: bool
  };

  render() {
    const { isLoading, timedOut, pastDelay, error } = this.props;

    if (isLoading) {
      if (timedOut) {
        return (
          <div>A timeout occurred while loading the associated component.</div>
        );
      }

      return pastDelay ? <Spinner /> : null;
    }

    if (error) {
      return <Error error={error} />;
    }

    return null;
  }
}
