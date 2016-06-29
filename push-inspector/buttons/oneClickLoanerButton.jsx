import React from 'react';
import { Component } from 'react';
import * as bs from 'react-bootstrap';
import { connect } from 'react-redux';
import * as actions from '../actions';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import ConfirmAction from '../shared/confirmAction';

class OneClickLoaner extends Component {

  constructor(props) {
    super(props);  
  }

  render() {
    
    const glyph = "console",
    		  label = "One-Click Loaner",
          successMsg = "abc abc abc";
    

    const { status, cancelTask } = this.props,
          taskId = status.taskId;

    const oneClickLoanerContent = (
      <div>
        <p>
          Ready for One click loaner?
        </p>
      </div>
    );  

    
    return (
               
  		<ConfirmAction 
	      	label = {label}
	      	glyph = {glyph}
	      	action = {() => {console.log('one click loaner clicked')}} >
	      	{oneClickLoanerContent}
    	</ConfirmAction>
          
    );
  }

}

function mapStateToProps(state) {
  return {
    status: state.status,
  }
}

export default connect(mapStateToProps, actions )(OneClickLoaner);