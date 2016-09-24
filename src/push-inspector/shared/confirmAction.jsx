import React, { Component } from 'react';
import { Button, Glyphicon, Modal } from 'react-bootstrap';
import { connect } from 'react-redux';
import * as actions from '../actions';
import Loading from './loading';
import { rendering } from '../lib/utils';

class ConfirmAction extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showDialog: false,
      executing: false
    };

    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.executeAction = this.executeAction.bind(this);
  }

  /**
  * Close dialog and set executing to false
  */
  close() {
    this.setState({
      showDialog: false,
      executing: false
    });

    // Clear message
    this.props.clearTaskActionsMessage();
  }

  /**
  * Open dialog
  */
  open() {
    this.setState({ showDialog: true });
  }

  /**
  * Execute action and set executing to true
  */
  executeAction() {
    this.setState({ executing: true });
    this.props.action();
  }

  message() {
    const { taskActionInProgress, taskActionMessage } = this.props;

    if (taskActionInProgress) {
      return <Loading />;
    }

    return taskActionMessage && taskActionMessage instanceof Error ?
      rendering.renderError(taskActionMessage) :
      rendering.renderSuccess(taskActionMessage);
  }

  render() {
    const { label, glyph, action, children, disabled } = this.props;
    const message = this.message();
    const dialogContent = (
      <span>
        <hr/>
        <h4>Status</h4>
        <span>
          {message}
        </span>
      </span>
    );

    return (
      <div>
        <Button
          bsSize="small"
          onClick={this.open}
          disabled={disabled}>
          <Glyphicon glyph={glyph} />
          &nbsp;{label}
        </Button>

        <Modal show={this.state.showDialog} onHide={this.close}>
          <Modal.Header closeButton>
            <Modal.Title>{label}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="format-modal-text format-modal-body">
            {children}
            {(() => {
              if (this.state.executing) {
                return dialogContent;
              }
            })()}
          </Modal.Body>
          <Modal.Footer>
            {(() => {
              if (!this.state.executing) {
                return (
                  <Button onClick={this.executeAction}>
                    <Glyphicon glyph={glyph} /> {label}
                  </Button>
                );
              }
            })()}
            <Button onClick={this.close}>
              <Glyphicon glyph="remove" /> Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = ({ taskActionMessage, taskActionInProgress }) => (
  { taskActionMessage, taskActionInProgress }
);

export default connect(mapStateToProps, actions)(ConfirmAction);
