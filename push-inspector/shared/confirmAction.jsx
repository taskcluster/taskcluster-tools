import React from 'react';
import { Component } from 'react';
import * as bs from 'react-bootstrap';
import { connect } from 'react-redux';
import * as actions from '../actions';
import format from '../../lib/format';
import { rendering } from '../lib/utils';

class ConfirmAction extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showDialog: false,
      executing: false,
      result: undefined
    }

    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.executeAction = this.executeAction.bind(this);
  }

  
  close() {
    this.setState({
      showDialog: false,
      executing: false,
      result: undefined
    }); 
  }

  open() {
    this.setState({showDialog: true});
  }

  executeAction() {
    this.setState({executing: true});
    let result = this.props.action(),
        message = undefined;  
  }

  render() {
    
    const { label, glyph, action, children, disabled } = this.props;

    const dialogContent = (
      <span>
        <hr/>
        <h4>Status</h4>
        <span>  
          {this.props.taskActionMessage}
        </span>
        <span>
          {this.state.result || this.props.success}
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
              !(this.state.executing || this.state.result) ? (  
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
  }
}

export default connect(mapStateToProps, actions )(ConfirmAction)