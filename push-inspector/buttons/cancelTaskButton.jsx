import React from 'react';
import { Component } from 'react';
import * as bs from 'react-bootstrap';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import ConfirmAction from '../shared/confirmAction';

export default class CancelTaskButton extends Component {

  constructor(props) {
    super(props);
  
    this.cancel = this.cancel.bind(this);
  }

  cancel() {
  	console.log('cancelling');
  }


  render() {
    
    const glyph = "stop",
    		  label = "Cancel Task";
    	

    const cancelContent = (
      <div>
        <p>
          Are you sure you wish to cancel this task?
          Notice that another process or developer may still be able to
          schedule a rerun. But all existing runs will be aborted and any
          scheduling process will not be able to schedule the task.
        </p>
      </div>
    );  

    return (
               
  		<ConfirmAction 
	      	label = {label}
	      	glyph = {glyph}
	      	action = {this.cancel} >
            
	      	{cancelContent}

    	</ConfirmAction>
          
    );
  }

}
