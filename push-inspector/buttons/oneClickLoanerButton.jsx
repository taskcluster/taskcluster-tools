import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import ConfirmAction from '../shared/confirmAction';

class OneClickLoaner extends Component {
  constructor(props) {
    super(props);  
  }

  render() {  
    const glyph = 'console';
    const label = 'One-Click Loaner';
    const successMsg = 'You have successfully been redirected to One-Click loaner';
    const { status, task, tasks, loanerCreateTask } = this.props;
    const taskId = status.taskId;
    const action = () => loanerCreateTask(tasks, taskId, task, successMsg);

    return (         
  		<ConfirmAction label={label} glyph={glyph} action={action}>
      	<div>
          This will duplicate the task and create it under a different
          <code>taskId</code>.<br /><br />
          The new task will be altered as to:
          <ul>
            <li>Set <code>task.payload.features.interactive = true</code>,</li>
            <li>Strip <code>task.payload.caches</code> to avoid poisoning,</li>
            <li>Ensures <code>task.payload.maxRunTime</code> is minimum 60 minutes,</li>
            <li>Strip <code>task.routes</code> to avoid side-effects, and</li>
            <li>Set the environment variable<code>TASKCLUSTER_INTERACTIVE=true</code>.</li>
          </ul>
          Note: this may not work with all tasks.
        </div>
    	</ConfirmAction>
    );
  }
}

function mapStateToProps(state) {
  return {
    status: state.status,
    task: state.task,
    tasks: state.tasks
  };
}

export default connect(mapStateToProps, actions)(OneClickLoaner);
