import React from 'react';
import { Component } from 'react';
import * as bs from 'react-bootstrap';
import format from '../../lib/format';
import utils from '../../lib/utils';


export default class Loading extends Component {
  render() {
    return (        
	    <div className="spinner">
	    	<format.Icon name="spinner" size="2x" spin="true"></format.Icon>
	    </div>      
    );
  }
}
