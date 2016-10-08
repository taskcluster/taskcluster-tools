import React from 'react';
import { Button, Glyphicon, Modal } from 'react-bootstrap';
import * as utils from '../utils';

/** Button with an associated confirm dialog */
const RunLocally = React.createClass({
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
    children: React.PropTypes.node.isRequired
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
      resultError: null,
      result: null
    };
  },

  render() {
    return (
      <Button
        bsSize={this.props.buttonSize}
        bsStyle={this.props.buttonStyle}
        disabled={this.props.disabled}
        onClick={this.openDialog}>
          <Glyphicon glyph={this.props.glyph} /> <span>{this.props.label}</span>
          {this.renderDialog()}
      </Button>
    );
  },

  renderDialog() {
    return (
      <Modal bsStyle="primary" show={this.state.showDialog} onHide={this.closeDialog}>
        <Modal.Header closeButton>
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
                  {this.renderWaitFor('result')}
                </span>
              </div>
            ) :
            null
          }
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.closeDialog} bsStyle="default">
            <Glyphicon glyph="remove" /> Close
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
  }
});

export default RunLocally;
