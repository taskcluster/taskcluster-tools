import React from 'react';
import { Component } from 'react';
import * as bs from 'react-bootstrap';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import ConfirmAction from '../shared/confirmAction';

export default class RetriggerButton extends Component {

  constructor(props) {
    super(props);
  
    this.retrigger = this.retrigger.bind(this);
  }

  retrigger() {
  	console.log('retriggering');
  }


  render() {
    
    const glyph = "repeat",
    		  label = "Retrigger";
    	

    const retriggerContent = (
      <div>
        <p>
          This will duplicate the task and create it under a different
          <code>taskId</code>.<br/><br/>
          The new task will be altered as to:
          <ul>
            <li>Set <code>task.payload.features.interactive = true</code>,</li>
            <li>Strip <code>task.payload.caches</code> to avoid poisoning,</li>
            <li>Ensures <code>task.payload.maxRunTime</code> is minimum 60 minutes,</li>
            <li>Strip <code>task.routes</code> to avoid side-effects, and</li>
            <li>Set the environment variable<code>TASKCLUSTER_INTERACTIVE=true</code>.</li>
          </ul>
          Note: this may not work with all tasks.
        </p>
      </div>
    );  	  

    return (
               
  		<ConfirmAction 
	      	label = {label}
	      	glyph = {glyph}
	      	action = {this.retrigger} >
            
	      	{retriggerContent}

    	</ConfirmAction>
          
    );
  }

}
