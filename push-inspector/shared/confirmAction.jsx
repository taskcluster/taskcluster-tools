import React, { Component } from 'react';
import * as bs from 'react-bootstrap';
import { connect } from 'react-redux';
import * as actions from '../actions';
import Loading from './loading';

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
    
    if (!!taskActionInProgress) {
      return <Loading />;
    } else {
      return taskActionMessage;
    }
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
        <bs.Button          
          bsSize="small"
          onClick={this.open}
          disabled={disabled}>
          <bs.Glyphicon glyph={glyph} />
          &nbsp;{label}
        </bs.Button>

        <bs.Modal show={this.state.showDialog} onHide={this.close}>
          <bs.Modal.Header closeButton>
            <bs.Modal.Title>{label}</bs.Modal.Title>
          </bs.Modal.Header>
          <bs.Modal.Body className="format-modal-text format-modal-body">
            {children}
            {(() => {
              if(this.state.executing) {
                return dialogContent;
              }
            }())}              
          </bs.Modal.Body>
          <bs.Modal.Footer>
            {(() => {
              if (!this.state.executing) {
                return (
                  <bs.Button onClick={this.executeAction}>
                    <bs.Glyphicon glyph={glyph} /> {label}
                  </bs.Button>
                );
              }
            }())}
            <bs.Button onClick={this.close}>
              <bs.Glyphicon glyph="remove" /> Close
            </bs.Button>
          </bs.Modal.Footer>
        </bs.Modal>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    taskActionMessage: state.taskActionMessage,
    taskActionInProgress: state.taskActionInProgress
  };
}

export default connect(mapStateToProps, actions)(ConfirmAction);
