import React from 'react';
import { Component } from 'react';
import * as bs from 'react-bootstrap';

export default class Modal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    }

    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.handleOnClick = this.handleOnClick.bind(this);
  }

  close() {
    this.setState({
      showModal: false
    })
  }

  open() {
    this.setState({
      showModal: true
    })
  }

  handleOnClick() {
    this.props.action();
    this.close();
  }

  render() {
    

    const { label, glyph, action, children } = this.props;

    return (
      <div>
        <bs.Button          
          bsSize="small"
          onClick={this.open}
        >
          <bs.Glyphicon glyph={glyph} />
          &nbsp;{label}
        </bs.Button>

        <bs.Modal show={this.state.showModal} onHide={this.close}>
          <bs.Modal.Header closeButton>
            <bs.Modal.Title>{label}</bs.Modal.Title>
          </bs.Modal.Header>
          <bs.Modal.Body>
            {children}
          </bs.Modal.Body>
          <bs.Modal.Footer>
            <bs.Button onClick={this.handleOnClick}>
              <bs.Glyphicon glyph={glyph} />
              &nbsp;{label}
            </bs.Button>
            <bs.Button onClick={this.close}>Close</bs.Button>
          </bs.Modal.Footer>
        </bs.Modal>
      </div>
    );

  }

}
