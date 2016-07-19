import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import ConfirmAction from '../shared/confirmAction';

class ScheduleTaskButton extends Component {
  constructor(props) {
    super(props);  
  }

  render() {  
    const glyph = "play";
    const label = "Schedule Task";
    const successMsg = "Successfully scheduled task!";  
    const { status, scheduleTask } = this.props;
    const taskId = status.taskId;         
    
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
        action = {() => { scheduleTask(taskId, successMsg)}}
        disabled = {status.state !== 'unscheduled'} >          
        {scheduleContent}
      </ConfirmAction>          
    );
  }

}

function mapStateToProps(state) {
  return {
    status: state.status
  };
}

export default connect(mapStateToProps, actions)(ScheduleTaskButton);
