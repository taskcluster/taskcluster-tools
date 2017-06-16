import React, { Component } from 'react';

export default class LegendItem extends Component {
  render() {
    return (
      <li style={{ display: 'inline', marginRight: 16 }}>
        <span
          className={`label-${this.props.bg}`}
          style={{ width: 6, height: 16, display: 'inline-block', verticalAlign: 'sub', marginRight: 2 }} />&nbsp;
        {this.props.children}
      </li>
    );
  }
}
