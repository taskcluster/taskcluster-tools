import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import ConfirmAction from '../shared/confirmAction';

class CancelTaskButton extends Component {
  render() {
    const glyph = 'stop';
    const label = 'Cancel Task';
    const successMsg = 'Successfully canceled task!';
    const { status, cancelTask } = this.props;
    const taskId = status.taskId;
    const action = () => cancelTask(taskId, successMsg);

    const isResolved = [
      'completed',
      'failed',
      'exception'
    ].includes(status.state);

    return (
      <ConfirmAction label={label} glyph={glyph} action={action} disabled={isResolved}>
        <div>
          <p>
            Are you sure you wish to cancel this task?<br />
            Notice that another process or developer may still be able to
            schedule a rerun. All existing runs will be aborted and any
            scheduling process will not be able to schedule the task.
          </p>
        </div>
      </ConfirmAction>
    );
  }
}

const mapStateToProps = ({ status }) => ({ status });

export default connect(mapStateToProps, actions)(CancelTaskButton);
