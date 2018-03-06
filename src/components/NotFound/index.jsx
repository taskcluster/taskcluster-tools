import { PureComponent } from 'react';
import ErrorStatus from '../Error';

export default class NotFound extends PureComponent {
  render() {
    const ex = Object.assign(
      new Error(
        `The requested route ${this.props.location.pathname} was not found.`
      ),
      {
        response: {
          status: 404
        }
      }
    );

    return <ErrorStatus error={ex} />;
  }
}
