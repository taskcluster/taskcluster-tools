import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import ConfirmAction from '../shared/confirmAction';

class EditAndCreateButton extends Component {
  render() {
    const glyph = 'edit';
    const label = 'Edit and Create';
    const successMsg = 'Upon creation, you will need to refresh the page to see the new task.';
    const { task, editAndCreateTask } = this.props;
    const action = () => editAndCreateTask(task, successMsg);

    return (
      <ConfirmAction label={label} glyph={glyph} action={action}>
        <div>
          <p>
            Are you sure you wish to edit this task?<br />
            Note that the edited task will not be linked to other tasks or
            have the same <code>task.routes</code> as other tasks,
            so this is not a way to "fix" a failing task in a larger task graph.
            Note that you may also not have the scopes required to create the
            resulting task.
          </p>
        </div>
      </ConfirmAction>
    );
  }
}

const mapStateToProps = ({ task }) => ({ task });

export default connect(mapStateToProps, actions)(EditAndCreateButton);
