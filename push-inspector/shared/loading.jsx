import React, { Component } from 'react';
import format from '../../lib/format';


export default class Loading extends Component {
  render() {
    const spin = true;
    const name = "spinner";
    const size = "2x";
    return (        
      <div className="spinner">
        <format.Icon name={name} size={size} spin={spin}></format.Icon>
      </div>      
    );
  }
}
