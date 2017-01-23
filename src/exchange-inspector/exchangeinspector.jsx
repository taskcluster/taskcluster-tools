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

  render() {
    const exchangeSelected = this.state.selectedExchange != null;

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
  
  renderExchangesTable() {
    return this.renderWaitFor('exchanges') || (
      <Table condensed={true} hover={true} className="exchange-inspector-exchanges-table">
        <tbody>
          {
            this.state.exchanges.map((exchange, key) => (
              <tr
                key={key}
                className={this.state.selectedExchange === exchange ? 'info' : null}
                onClick={() => this.selectExchange(exchange)}>
                <td><code>{exchange.name}</code></td>
              </tr>
            ))
          }
        </tbody>
      </Table>
    );
  },

  selectExchange(exchange) { 
    this.setState({selectedExchange: exchange});
  },

});
