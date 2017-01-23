import React from 'react';
import {Row, Col} from 'react-bootstrap';
import * as utils from '../lib/utils';
import * as auth from '../lib/auth';
import taskcluster from 'taskcluster-client';
import './exchangeinspector.less';

const ExchangeDetails = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        pulse: taskcluster.Pulse,
      },
    }),
  ],

  getDefaultProps() {
    return {
      currentExchange: {},
    };
  }, 

  getInitialState() {
    return {
      exchangeLoaded: false,
      exchangeError: null,
    };
  },

  load() {
    return {
      exchangeError: null,
    };
  },

  render() {
    const args = Object.values(this.props.currentExchange.arguments);

    return (
      <div>
        <Row style={{marginTop: 0}}>
          <label className="control-label col-md-3">Name</label>
          <Col md={9}>
            {this.props.currentExchange.name}
          </Col>
        </Row> 
        <Row>
          <label className="control-label col-md-3">Virtual Host</label>
          <Col md={9}>
            {this.props.currentExchange.vhost}
          </Col>
        </Row>
        <Row>
          <label className="control-label col-md-3">Type</label>
          <Col md={9}>
            {this.props.currentExchange.type}
          </Col>
        </Row>
        <Row>
          <label className="control-label col-md-3">Durable</label>
          <Col md={9}>
            {`${this.props.currentExchange.durable}`}
          </Col>
        </Row>
        <Row>
          <label className="control-label col-md-3">Auto-Delete</label>
          <Col md={9}>
            {`${this.props.currentExchange.auto_delete}`}
          </Col>
        </Row>
        <Row>
          <label className="control-label col-md-3">Internal</label>
          <Col md={9}>
            {`${this.props.currentExchange.internal}`}
          </Col>
        </Row>
        <Row>
          <label className="control-label col-md-3">Arguments</label>
          <Col md={9}>
            {
              args.length ? (
                <ul>{args.map((arg, key) => <li key={key}><code>{arg}</code></li>)}</ul>
              ) : (
                <span>No arguments</span>
              )
            }
          </Col>
        </Row>
      </div>
      ); 
  }, 
});

export default ExchangeDetails;
