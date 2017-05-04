import React, {Component} from 'react';

export default class Legend extends Component {
  render() {
    return (
      <ul style={{listStyle: 'none', display: 'block', height: 20, padding: 0, textAlign: 'right'}}>
        {this.props.children}
      </ul>
    );
  }
}
