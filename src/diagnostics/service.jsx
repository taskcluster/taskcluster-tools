import React from 'react';
import { Col } from 'react-bootstrap';

export default class Service extends React.Component {
  constructor(props) {
    super(props);
    this.showFailing = this.showFailing.bind(this);
    this.showPassing = this.showPassing.bind(this);
  }

  render() {
    return (
      <Col md={3}>
        <p><strong>{this.props.title}</strong></p>
        {this.props.test.pass.length ? this.showPassing() : ''}
        {this.props.test.fail.length ? this.showFailing() : ''}
      </Col>
    );
  }

  showPassing() {
    return (
      <div>
        <p><strong>Passing:</strong> </p>
        <ul className="container-fluid pass">
          {this.props.test.pass.map((res, key) => <li key={key}>{res}</li>)}
        </ul>
      </div>
    );
  }

  showFailing() {
    return (
      <div>
        <p><strong>Failing:</strong> </p>
        <ul>
          {this.props.test.fail.map((res, key) => <li key={key}>{res}</li>)}
        </ul>
      </div>
    );
  }
}
