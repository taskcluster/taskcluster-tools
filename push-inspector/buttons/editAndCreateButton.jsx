import React from 'react';
import { Component } from 'react';
import * as bs from 'react-bootstrap';
import { connect } from 'react-redux';
import * as actions from '../actions';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import ConfirmAction from '../shared/confirmAction';

class EditAndCreateButton extends Component {

  constructor(props) {
    super(props);  
  }

  render() {
    
    const glyph = "edit",
    		  label = "Edit and Create",
          successMsg = "Upon creation, you will need to refresh the page to see the new task";
    

    const { task, editAndCreateTask } = this.props;

    const editAndCreateContent = (
      <div>
        <p>
          Are you sure you wish to edit this task?<br/>
          Note that the edited task will not be linked to other tasks or
          have the same <code>task.routes</code> as other tasks,
          so this is not a way to "fix" a failing task in a larger task graph.
          Note that you may also not have the scopes required to create the
          resulting task.
        </p>
      </div>
    );  

    
    return (
               
  		<ConfirmAction 
	      	label = {label}
	      	glyph = {glyph}
	      	action = {() => {editAndCreateTask(task, successMsg)}} >
	      	{editAndCreateContent}
    	</ConfirmAction>
          
    );
  }

}

function mapStateToProps(state) {
  return {
    task: state.task
  }
}

export default connect(mapStateToProps, actions )(EditAndCreateButton);