import React from 'react';
import { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import * as bs from 'react-bootstrap';
import taskcluster from 'taskcluster-client';
import slugid from 'slugid';
import _ from 'lodash';
import ConfirmAction from '../shared/confirmAction';

class RetriggerButton extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    
    const glyph = "repeat",
    		  label = "Retrigger",
          successMsg = "Retrigger success";

    const { tasks, task, retriggerTask } = this.props;
  
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
	      	action = {() => retriggerTask(tasks,task, successMsg)} >
	      	{retriggerContent}
    	</ConfirmAction>

    );
  }

}

function mapStateToProps(state) {
  return {
    task: state.task,
    tasks: state.tasks,
  }
}

export default connect(mapStateToProps, actions )(RetriggerButton);
