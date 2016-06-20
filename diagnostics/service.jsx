import React from 'react';
import { Col } from 'react-bootstrap';

export default class Service extends React.Component {

  constructor (props) {
    super(props);
    this.showFailing = this.showFailing.bind(this);
    this.showPassing = this.showPassing.bind(this);
  }

  render () {
    return <Col md={3} fluid={true}>
      <p><b>{this.props.title}</b></p>
      { (this.props.test.pass.length)? this.showPassing() : '' }
      { (this.props.test.fail.length)? this.showFailing() : '' }
    </Col>
  }

  showPassing () {
    return <div> 
<<<<<<< HEAD
      <p><b>Passing:</b> </p>
=======
      <p>Passing: </p>
>>>>>>> f6fd10ca700644a5f578838b0583c0899a528780
      <ul className="container-fluid pass">
       {
          this.props.test.pass.map(res => <li>{res}</li>)
       }
      </ul>
    </div>
  }

  showFailing () {
    return <div> 
<<<<<<< HEAD
      <p><b>Failing:</b> </p>
=======
      <p>Failing: </p>
>>>>>>> f6fd10ca700644a5f578838b0583c0899a528780
      <ul>
        {
          this.props.test.fail.map(res => <li>{res}</li>)
        }
      </ul>
    </div>
  }
}


