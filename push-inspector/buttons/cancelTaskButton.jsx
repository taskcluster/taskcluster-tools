import React from 'react';
import { Component } from 'react';
import * as bs from 'react-bootstrap';
import { connect } from 'react-redux';
import * as actions from '../actions';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import ConfirmAction from '../shared/confirmAction';

class CancelTaskButton extends Component {

  constructor(props) {
    super(props);  
  }

  render() {
    
    const glyph = "stop",
    		  label = "Cancel Task",
          successMsg = "Successfully canceled task!";
    

    const { status, cancelTask } = this.props,
          taskId = status.taskId;

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

    var isResolved = [
      'completed',
      'failed',
      'exception'
    ].indexOf(status.state) !== -1;

    return (
               
  		<ConfirmAction 
	      	label = {label}
	      	glyph = {glyph}
	      	action = {() => { cancelTask(taskId, successMsg)}}
          disabled = {isResolved} >
	      	{cancelContent}
    	</ConfirmAction>
          
    );
  }

}

function mapStateToProps(state) {
  return {
    status: state.status,
  }
}

export default connect(mapStateToProps, actions )(CancelTaskButton);