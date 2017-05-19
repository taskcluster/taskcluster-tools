import React, {Component} from 'react';
import {Button, Glyphicon, Modal} from 'react-bootstrap';
import {TaskClusterEnhance} from '../utils';

/** Button with an associated confirm dialog */
class ConfirmActionMenuItem extends Component {
  constructor(props) {
    super(props);

    this.state = this.initialState();

    this.openDialog = this.openDialog.bind(this);
    this.closeDialog = this.closeDialog.bind(this);
    this.executeAction = this.executeAction.bind(this);
    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
  }

  initialState() {
    return {
      showDialog: false,
      executing: false,
      resultLoaded: false,
      resultError: null,
      result: null
    }
  }

  componentWillMount() {
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
  }

  onTaskClusterUpdate({detail}) {
    if (detail.name !== this.constructor.name) {
      return;
    }

    this.setState(detail.state);
  }

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
  }

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
                  {this.props.renderWaitFor('result') || this.props.success}
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
  }

  openDialog() {
    this.setState({showDialog: true});
  }

  closeDialog() {
    this.setState(this.initialState());
  }

  /** Execute asynchronous action */
  executeAction() {
    this.props.loadState({
      executing: true,
      result: (async () => {
        const result = await this.props.action();

        this.setState({executing: false});

        return result;
      })(),
    });
  }
}

ConfirmActionMenuItem.propTypes = {
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
};

ConfirmActionMenuItem.defaultProps = {disabled: false};

const taskclusterOpts = {
  name: ConfirmActionMenuItem.name
};

// TaskClusterEnhance is used so we can use loadState to execute the action asynchronously
export default TaskClusterEnhance(ConfirmActionMenuItem, taskclusterOpts);
