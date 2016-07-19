import React, { Component } from 'react';
import format from '../../lib/format';

export default class Loading extends Component {
  render() {
    return (        
      <div className="spinner">
        <format.Icon name="spinner" size="2x" spin={true}></format.Icon>
      </div>      
    );
  }
};
