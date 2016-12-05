import React from 'react';
import {Row, Col, ButtonToolbar, Button, Glyphicon, Table} from 'react-bootstrap';
import ExchangeDetails from './exchangedetails.jsx';
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
      type: 'json',
    }),
  ],

  /** Create an initial state */
  getInitialState() {
    return {
      exchangesLoaded: false,
      exchangesError: null,
      exchanges: null,
      selectedExchange: null,
    };
  },
  
  load() {
    return {
      exchanges: this.pulse.exchanges(),
    };
  },

  /** Render user-interface */
  render() {
    const exchangeSelected = this.state.selectedExchange != null && typeof this.state.selectedExchange != 'undefined';
    return (
      <Row style={{marginTop: 10}}>
        <Col md={5}>
          <h4 style={{marginTop: 0}}>Exchange Name</h4>
          {this.renderExchangesTable()}
          <ButtonToolbar>
            <Button bsStyle="success" onClick={this.reload} disabled={!this.state.exchangesLoaded}>
              <Glyphicon glyph="refresh" /> Refresh
            </Button>
          </ButtonToolbar> 
        </Col>
        <Col md={5}>
          <h4 style={{marginTop: 0}}>Exchange Details</h4>
          {
            exchangeSelected ? (
              <ExchangeDetails currentExchange={this.state.selectedExchange} />
            ) : (
              <div>Select an exchange to view details</div>
            )
          }
        </Col>
      </Row>
    ); 
  },
  
  /** Render table of all exchanges */
  renderExchangesTable() {
    return this.renderWaitFor('exchanges') || (
      <Table condensed={true} hover={true} className="exchange-inspector-exchanges-table">
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

});
