import { Component } from 'react';
import { Col } from 'react-bootstrap';

export default class Service extends Component {
  showPassing() {
    return (
      <div>
        <p>
          <strong>Passing: </strong>
        </p>
        <ul className="container-fluid pass">
          {this.props.test.pass.map((res, key) => (
            <li key={`test-pass-${key}`}>{res}</li>
          ))}
        </ul>
      </div>
    );
  }

  showFailing() {
    return (
      <div>
        <p>
          <strong>Failing: </strong>
        </p>
        <ul>
          {this.props.test.fail.map((res, key) => (
            <li key={`test-fail-${key}`}>{res}</li>
          ))}
        </ul>
      </div>
    );
  }

  render() {
    return (
      <Col md={3}>
        <p>
          <strong>{this.props.title}</strong>
        </p>
        {this.props.test.pass.length ? this.showPassing() : null}
        {this.props.test.fail.length ? this.showFailing() : null}
      </Col>
    );
  }
}
