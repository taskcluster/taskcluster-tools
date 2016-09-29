import React from 'react';
import { Button, Glyphicon, Modal } from 'react-bootstrap';
import * as utils from '../utils';

/** Button with an associated confirm dialog */
const ConfirmAction = React.createClass({
  mixins: [
    // We use loadState to execute the action asynchronously
    utils.createTaskClusterMixin()
  ],

  propTypes: {
    // Button size, style, glyph and disabled
    buttonSize: React.PropTypes.string,
    buttonStyle: React.PropTypes.string.isRequired,
    disabled: React.PropTypes.bool.isRequired,
    glyph: React.PropTypes.string.isRequired,
    label: React.PropTypes.string.isRequired,
    // Text explaining action and success text for successful action
    children: React.PropTypes.node.isRequired,
    success: React.PropTypes.string.isRequired,
    // Function executing action, returns promise
    action: React.PropTypes.func.isRequired
  },

  getDefaultProps() {
    return {
      disabled: false
    };
  },

  getInitialState() {
    return {
      showDialog: false,
      executing: false,
      resultLoaded: false,
      resultError: undefined,
      result: undefined
    };
  },

  render() {
    return (
      <Button bsSize={this.props.buttonSize}
                 bsStyle={this.props.buttonStyle}
                 disabled={this.props.disabled}
                 onClick={this.openDialog}>
        <Glyphicon glyph={this.props.glyph}/>&nbsp;
        <span>{this.props.label}</span>&nbsp;
        {this.renderDialog()}
      </Button>
    );
  },

  renderDialog() {
    return (
      <Modal bsStyle="primary"
        show={this.state.showDialog}
        onHide={this.closeDialog}>
        <Modal.Header closeButton>
          {this.props.label}
        </Modal.Header>
        <Modal.Body>
          <span>{this.props.children}</span>
          {
            this.state.executing ? (
              <span>
                <hr/>
                <h4>Status</h4>
                <span>
                  {this.renderWaitFor('result') || this.props.success}
                </span>
              </span>
            ) : undefined
          }
        </Modal.Body>
        <Modal.Footer>
          {
            !(this.state.executing || this.state.result) ? (
              <Button
                  onClick={this.executeAction}
                  bsStyle={this.props.buttonStyle}
                  hidden={this.state.result}>
                <Glyphicon glyph={this.props.glyph}/>&nbsp;
                <span>{this.props.label}</span>
              </Button>
            ) : undefined
          }
          <Button onClick={this.closeDialog} bsStyle="default">
            <Glyphicon glyph="remove"/>&nbsp;
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  },

  openDialog() {
    this.setState({ showDialog: true });
  },

  closeDialog() {
    this.setState(this.getInitialState());
  },

  /** Execute asynchronous action */
  executeAction() {
    this.loadState({
      executing: true,
      result: (async () => {
        const result = await this.props.action();
        this.setState({ executing: false });
        return result;
      })()
    });
  }
});

export default ConfirmAction;
