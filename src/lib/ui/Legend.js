import React from 'react';

export default class extends React.Component {
  static displayName = 'Legend';

  render() {
    return (
      <ul style={{listStyle: 'none', display: 'block', height: 20, padding: 0, textAlign: 'right'}}>
        {this.props.children}
      </ul>
    );
  }
}
