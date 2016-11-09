import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as actions from '../actions';
import ConfirmAction from './ConfirmAction';

class ScheduleTask extends Component {
  render() {
    const {status, scheduleTask} = this.props;

    return (
      <ConfirmAction
        label="Schedule Task"
        glyph="play"
        action={() => scheduleTask(status.taskId, 'Successfully scheduled task!')}
        disabled={status.state !== 'unscheduled'}>
        <div>
          <p>
            Are you sure you wish to schedule the task?
            This will <strong>overwrite any scheduling process</strong> taking place.
            If this task is part of a continuous integration process scheduling
            this task may cause your code to land with broken tests.
          </p>
        </div>
      </ConfirmAction>
    );
  }
}

const mapStateToProps = ({status}) => ({status});

export default connect(mapStateToProps, actions)(ScheduleTask);
