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
          successMsg = "abc abc abc";
    

    const { status, cancelTask } = this.props,
          taskId = status.taskId;

    const editAndCreateContent = (
      <div>
        <p>
          Are you sure you wish to edit and create?
        </p>
      </div>
    );  

    
    return (
               
  		<ConfirmAction 
	      	label = {label}
	      	glyph = {glyph}
	      	action = {() => {console.log('edit and create clicked')}} >
	      	{editAndCreateContent}
    	</ConfirmAction>
          
    );
  }

}

function mapStateToProps(state) {
  return {
    status: state.status,
  }
}

export default connect(mapStateToProps, actions )(EditAndCreateButton);