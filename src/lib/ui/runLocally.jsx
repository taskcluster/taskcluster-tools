import React from 'react';
import { Button, Modal } from 'react-bootstrap';

/** Button with an associated dialog containing code to run locally */
const RunLocally = React.createClass({

  propTypes: {
    // Button size, style
    buttonSize: React.PropTypes.string,
    buttonStyle: React.PropTypes.string.isRequired,
    label: React.PropTypes.string.isRequired,
    children: React.PropTypes.node.isRequired
  },

  getInitialState() {
    return {
      showDialog: false
    };
  },

  render() {
    return (
      <Button
        bsSize={this.props.buttonSize}
        bsStyle={this.props.buttonStyle}
        onClick={this.openDialog}>
          <span>{this.props.label}</span>
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
        </Modal.Body>
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
