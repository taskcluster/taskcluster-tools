import React, {Component} from 'react';
import {MenuItem, Glyphicon, Modal, Button} from 'react-bootstrap';
import {connect} from 'react-redux';
import * as actions from '../actions';
import Loading from '../shared/loading';
import {rendering} from '../lib/utils';

class ConfirmAction extends Component {
  constructor(props) {
    super(props);
    this.state = {showDialog: false, executing: false};
  }

  close() {
    // Close dialog and set executing to false
    this.setState({showDialog: false, executing: false});
    // Clear message
    this.props.clearTaskActionsMessage();
  }

  open() {
    this.setState({showDialog: true});
  }

  executeAction() {
    this.setState({executing: true});
    this.props.action();
  }

  message() {
    const {taskActionInProgress, taskActionMessage} = this.props;

    if (taskActionInProgress) {
      return <Loading />;
    }

    return taskActionMessage && taskActionMessage instanceof Error ?
      rendering.renderError(taskActionMessage) :
      rendering.renderSuccess(taskActionMessage);
  }

  render() {
    const {label, glyph, children, disabled} = this.props;
    const message = this.message();

    return (
      <MenuItem disabled={disabled} onClick={() => this.open()}>
        <Glyphicon glyph={glyph} /> <span>{label}</span>

        <Modal show={this.state.showDialog} onHide={() => this.close()}>
          <Modal.Header closeButton={true}>
            <Modal.Title>{label}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="format-modal-text format-modal-body">
            {children}
            {this.state.executing && (
              <div>
                <hr />
                <h4>Status</h4>
                {message}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            {!this.state.executing && (
              <Button onClick={() => this.executeAction()}>
                <Glyphicon glyph={glyph} /> {label}
              </Button>
            )}
            <Button onClick={() => this.close()}>
              <Glyphicon glyph="remove" /> Close
            </Button>
          </Modal.Footer>
        </Modal>
      </MenuItem>
    );
  }
}

const mapStateToProps = ({taskActionMessage, taskActionInProgress}) => ({
  taskActionMessage, taskActionInProgress,
});

export default connect(mapStateToProps, actions)(ConfirmAction);
