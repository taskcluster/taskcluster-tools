import React from 'react';
import {Button, Glyphicon, Modal, MenuItem} from 'react-bootstrap';
import * as utils from '../utils';

/** Button with an associated confirm dialog */
export default React.createClass({
  displayName: 'ConfirmActionMenuItem',

  mixins: [
    // We use loadState to execute the action asynchronously
    utils.createTaskClusterMixin(),
  ],

  propTypes: {
    disabled: React.PropTypes.bool.isRequired,
    glyph: React.PropTypes.string.isRequired,
    label: React.PropTypes.string.isRequired,
    // Text explaining action and success text for successful action
    children: React.PropTypes.node.isRequired,
    success: React.PropTypes.string.isRequired,
    // Function executing action, returns promise
    action: React.PropTypes.func.isRequired,
  },

  getDefaultProps() {
    return {
      disabled: false,
    };
  },

  getInitialState() {
    return {
      showDialog: false,
      executing: false,
      resultLoaded: false,
      resultError: null,
      result: null,
    };
  },

  render() {
    return (
      <MenuItem disabled={this.props.disabled} onClick={this.openDialog}>
        <Glyphicon glyph={this.props.glyph} /> <span>{this.props.label}</span>
        {this.renderDialog()}
      </MenuItem>
    );
  },

  renderDialog() {
    return (
      <Modal bsStyle="primary" show={this.state.showDialog} onHide={this.closeDialog}>
        <Modal.Header closeButton={true}>
          {this.props.label}
        </Modal.Header>
        <Modal.Body>
          <span>{this.props.children}</span>
          {
            this.state.executing ? (
              <div>
                <hr />
                <h4>Status</h4>
                <span>
                  {this.renderWaitFor('result') || this.props.success}
                </span>
              </div>
            ) :
            null
          }
        </Modal.Body>
        <Modal.Footer>
          {
            !(this.state.executing || this.state.result) ? (
              <Button
                onClick={this.executeAction}
                bsStyle={this.props.buttonStyle}
                hidden={this.state.result}>
                <Glyphicon glyph={this.props.glyph} /> <span>{this.props.label}</span>
              </Button>
            ) :
              null
          }
          <Button onClick={this.closeDialog} bsStyle="default">
            <Glyphicon glyph="remove" /> Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  },

  openDialog() {
    this.setState({showDialog: true});
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
        this.setState({executing: false});
        return result;
      })(),
    });
  },
});
