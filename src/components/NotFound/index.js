import React from 'react';

export default class NotFound extends React.PureComponent {
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

    return <div>{ex.toString()}</div>;
  }
}
