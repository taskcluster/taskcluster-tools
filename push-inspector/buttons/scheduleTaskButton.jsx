import React from 'react';
import { Component } from 'react';
import * as bs from 'react-bootstrap';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import ConfirmAction from '../shared/confirmAction';

export default class ScheduleTaskButton extends Component {

  constructor(props) {
    super(props);
  
    this.schedule = this.schedule.bind(this);
  }

  schedule() {
  	console.log('scheduleTask');
  }


  render() {
    
    const glyph = "play",
    		  label = "Schedule Task";
    	



    const scheduleContent = (
      <div>
        <p>
          Are you sure you wish to schedule the task?
          This will <b>overwrite any scheduling process</b> taking place,
          if this task is part of a continous integration process scheduling
          this task may cause your code to land with broken tests.
        </p>
      </div>
    );	  

    return (
               
  		<ConfirmAction 
	      	label = {label}
	      	glyph = {glyph}
	      	action = {this.schedule} >
            
	      	{scheduleContent}

    	</ConfirmAction>
          
    );
  }

}
