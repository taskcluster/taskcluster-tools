import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as actions from '../actions';
import ConfirmAction from '../shared/confirmAction';

class ScheduleTaskButton extends Component {
  render() {
    const glyph = 'play';
    const label = 'Schedule Task';
    const successMsg = 'Successfully scheduled task!';
    const {status, scheduleTask} = this.props;
    const taskId = status.taskId;
    const action = () => scheduleTask(taskId, successMsg);

    return (
      <ConfirmAction
        label={label}
        glyph={glyph}
        action={action}
        disabled={status.state !== 'unscheduled'}>
        <div>
          <p>
            Are you sure you wish to schedule the task?
            This will <strong>overwrite any scheduling process</strong> taking place,
            if this task is part of a continuous integration process scheduling
            this task may cause your code to land with broken tests.
          </p>
        </div>
      </ConfirmAction>
    );
  }
}

const mapStateToProps = ({status}) => ({status});

export default connect(mapStateToProps, actions)(ScheduleTaskButton);
