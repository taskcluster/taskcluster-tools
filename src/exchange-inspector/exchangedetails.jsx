import React from 'react';
import {Row, Col} from 'react-bootstrap';
import * as utils from '../lib/utils';
import * as auth from '../lib/auth';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
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
    const args = _.values(this.props.currentExchange.arguments);
    const argsExist = args.length != 0;
    return (
      <div>
        <Row style={{marginTop: 0}}>
          <label className="control-label col-md-3">Name</label>
          <div className="col-md-9">
            {this.props.currentExchange.name}
          </div>
        </Row> 
        <Row>
          <label className="control-label col-md-3">Virtual Host</label>
          <div className="col-md-9">
            {this.props.currentExchange.vhost}
          </div>
        </Row>
        <Row>
          <label className="control-label col-md-3">Type</label>
          <div className="col-md-9">
            {this.props.currentExchange.type}
          </div>
        </Row>
        <Row>
          <label className="control-label col-md-3">Durable</label>
          <div className="col-md-9">
            {`${this.props.currentExchange.durable}`}
          </div>
        </Row>
        <Row>
          <label className="control-label col-md-3">Auto-Delete</label>
          <div className="col-md-9">
            {`${this.props.currentExchange.auto_delete}`}
          </div>
        </Row>
        <Row>
          <label className="control-label col-md-3">Internal</label>
          <div className="col-md-9">
            {`${this.props.currentExchange.internal}`}
          </div>
        </Row>
        <Row>
          <label className="control-label col-md-3">Arguments</label>
          <div className="col-md-9">
            {
              argsExist ? (
                <ul>
                  {args.map(this.renderArguments)}
                </ul>
              ) : (
                <span>No arguments</span>
              )
            }
          </div>
        </Row>
      </div>
      ); 
  }, 
  
  renderArguments(arg, index) {
    return (
      <li key={index}>
        <code>{`${arg}`}</code>
      </li>
    ); 
  },

});

export default ExchangeDetails;
