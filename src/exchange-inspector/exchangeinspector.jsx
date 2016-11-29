import React from 'react';
import {Row, Col, ButtonToolbar, Button, Glyphicon, Table} from 'react-bootstrap';
import * as utils from '../lib/utils';
import * as auth from '../lib/auth';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import './exchangeinspector.less';

export default React.createClass({
  displayName: 'ExchangeInspector',

  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        pulse: taskcluster.Pulse,
      },
    }),
  // Serialize state.selectedExchange to location.hash as string
    utils.createLocationHashMixin({
      keys: ['selectedExchange'],
      type: 'string',
    }),
  ],

  /** Create an initial state */
  getInitialState() {
    return {
      exchangesLoaded: false,
      exchangesError: null,
      exchanges: null,
      selectedExchange: '',
    };
  },
  
  load() {
    return {
      exchanges: this.pulse.exchanges(),
    };
  },

  /** Render user-interface */
  render() {
    return (
      <Row style={{marginTop: 10}}>
        <Col md={5}>
          {this.renderExchangesTable()}
          <ButtonToolbar>
            <Button bsStyle="success" onClick={this.reload} disabled={!this.state.exchangesLoaded}>
              <Glyphicon glyph="refresh" /> Refresh
            </Button>
          </ButtonToolbar> 
        </Col>
        <Col md={5}>
          {this.renderExchangeDetails()} 
        </Col>
      </Row>
    ); 
  },
  
  /** Render table of all exchanges */
  renderExchangesTable() {
    return this.renderWaitFor('exchanges') || (
      <Table condensed={true} hover={true} className="exchange-inspector-exchanges-table">
        <thead>
          <tr>
            <th>Exchange Name</th>
          </tr>
        </thead>
        <tbody>
          {this.state.exchanges.map(this.renderExchangesRow)}
        </tbody>
      </Table>
    );
  },

  /** Render a row with an exchange*/
  renderExchangesRow(exchange, index) {
    const isSelected = this.state.selectedExchange === exchange;
    return (
      <tr
        key={index}
        className={isSelected ? 'info' : undefined}
        onClick={this.selectExchange.bind(this, exchange)}>
        <td><code>{exchange.name}</code></td>
      </tr>
    );
  },

  selectExchange(exchange) {
    this.setState({selectedExchange: exchange});
  },

  /** Render table of the properties of the selected exchange*/
  renderExchangeDetails() {
    const exchangeSelected = this.state.selectedExchange != '';
    //TODO: List exchange arguments as well
    if (exchangeSelected) {
      const exchange = this.state.selectedExchange;
      const exchangeDetails = Object.entries(exchange).map(([prop, value]) => ({prop, value})).slice(0, 6);
      return (
        <Table>
          <thead>
            <tr>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {exchangeDetails.map(this.renderDetails)}
          </tbody>
        </Table>
      ); 
    } else {
      return (
        <h6>Select an exchange to view details</h6>
      );
    }
  },
  
  /** Render a row containing a property and corresponding value of an exchange*/
  renderDetails(exchange, index) {
    return ( 
      <tr key={index}>
        <th>{exchange.prop}</th>
        <td>{`${exchange.value}`}</td>
      </tr>
    );
  },
  
});
