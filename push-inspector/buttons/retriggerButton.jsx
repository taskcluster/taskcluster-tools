import React from 'react';
import { Component } from 'react';
import * as bs from 'react-bootstrap';
import taskcluster from 'taskcluster-client';
import slugid from 'slugid';
import _ from 'lodash';
import ConfirmAction from '../shared/confirmAction';

export default class RetriggerButton extends Component {

  constructor(props) {
    super(props);
  
    this.createTask = this.createTask.bind(this);
  }

  // NOT WORKING YET
  createTask() {
  	console.log('retriggering');

    const queue = new taskcluster.Queue();

    let taskId = slugid.nice();
    let task = _.cloneDeep(this.props.task);

    console.log('TASK ID: ', taskId);

    let now = Date.now();
    let created = Date.parse(task.created);
    task.deadline = new Date(now + Date.parse(task.deadline) - created).toJSON();
    task.expires = new Date(now + Date.parse(task.expires) - created).toJSON();
    task.created = new Date(now).toJSON();

    task.retries = 0;

    
    let result =  queue.createTask(taskId, task);
    
    return result;
    //window.location = '/task-inspector/#' + taskId;
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
	      	action = {this.createTask} >
            
	      	{retriggerContent}

    	</ConfirmAction>
          
    );
  }

}
