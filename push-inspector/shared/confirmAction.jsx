import React from 'react';
import { Component } from 'react';
import * as bs from 'react-bootstrap';
import format from '../../lib/format';


export default class Modal extends Component {

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
    this.renderError = this.renderError.bind(this);
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


  renderError(err) {
    // Find some sort of summary or error code
    console.log('err: ', err);
    let code = err.code + ' Error!';
    if (!err.code && err.statusCode) {
      code = 'HTTP ' + err.statusCode;
    }
    code = code || 'Unknown Error';

    // Find some sort of message
    let message = err.message || '```\n' + err.stack + '\n```';

    let title = <bs.Button bsStyle="link">Additional details...</bs.Button>;
    return (
      <bs.Alert bsStyle="danger">
          <strong>
            {code}&nbsp;
          </strong>
          <format.Markdown>{message}</format.Markdown>
          <format.Collapse title={title}>
            <pre>
              {JSON.stringify(err.body, null, 2)}
            </pre>
          </format.Collapse>
        </bs.Alert>
    );
  }

  executeAction() {
    this.setState({executing: true});
    let result = this.props.action(),
        message = undefined;
  
    result.then((value) => {
      console.log('value: ', value);
      message = value;
    }, (reason) => {
      message = this.renderError(reason);
      this.setState({
        result: message
      });
    })
 
  }

  render() {
    
    const { label, glyph, action, children } = this.props;

    const dialogContent = (
      <span>
        <hr/>
        <h4>Status</h4>
        <span>
          {this.state.result}
        </span>
      </span>
    );

    return (
      <div>
        <bs.Button          
          bsSize="small"
          onClick={this.open}
        >
          <bs.Glyphicon glyph={glyph} />
          &nbsp;{label}
        </bs.Button>

        <bs.Modal show={this.state.showDialog} onHide={this.close}>
          <bs.Modal.Header closeButton>
            <bs.Modal.Title>{label}</bs.Modal.Title>
          </bs.Modal.Header>
          <bs.Modal.Body>
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
