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
    }

    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.executeAction = this.executeAction.bind(this);
  }

  
  close() {
    this.setState({
      showDialog: false,
      executing: false
    }); 
  }

  open() {
    this.setState({showDialog: true});
  }

  executeAction() {
    this.setState({executing: true});
    this.props.action();
  }


  message() {
    const { taskActionInProgress, taskActionMessage } = this.props;
    if(!!taskActionInProgress) {
      return <Loading />
    } else {
      return taskActionMessage
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
          disabled = {disabled}
        >
          <bs.Glyphicon glyph={glyph} />
          &nbsp;{label}
        </bs.Button>

        <bs.Modal show={this.state.showDialog} onHide={this.close}>
          <bs.Modal.Header closeButton>
            <bs.Modal.Title>{label}</bs.Modal.Title>
          </bs.Modal.Header>
          <bs.Modal.Body className="format-modal-text">
            {children}
            {this.state.executing ? ( dialogContent ) : undefined}              
          </bs.Modal.Body>
          <bs.Modal.Footer>
            {
              !(this.state.executing) ? (  
                <bs.Button onClick={this.executeAction}>
                  <bs.Glyphicon glyph={glyph} />
                  &nbsp;{label}
                </bs.Button>
              ) : undefined
            }
              
            <bs.Button onClick={this.close}>
              <bs.Glyphicon glyph="remove"/>&nbsp;
              Close
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
  }
}

export default connect(mapStateToProps, actions )(ConfirmAction)
