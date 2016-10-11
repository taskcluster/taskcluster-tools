import React from 'react';
import {
  Row,
  Col,
  ButtonToolbar,
  Glyphicon,
  Table,
  Button,
  FormGroup,
  ControlLabel,
  FormControl,
  Alert
} from 'react-bootstrap';
import * as utils from '../lib/utils';
import * as format from '../lib/format';
import taskcluster from 'taskcluster-client';
import { findDOMNode } from 'react-dom';

export default React.createClass({
  displayName: 'CacheManager',

  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        purgeCaches: taskcluster.PurgeCache
      }
    })
  ],

  /** Create an initial state */
  getInitialState() {
    return {
      caches: null,
      cachesLoaded: false,
      formError: null,
      tableError: null,
      formProvisionerId: '',
      formWorkerType: '',
      formCacheName: ''
    };
  },

  load() {
    return {
      caches: this.purgeCaches
        .allPurgeRequests()
        .then(resp => resp.requests)
    };
  },

  /** Render the main layout of the cache manager page */
  render() {
    return (
      <Row>
        <Col md={12}>
          <h4>Cache Purge Inspector</h4>
          <p>
            All currently active cache purges are displayed below.
            24 hours after creation, requests expire and are no longer displayed here.
            The <strong>before</strong> column is the time at which any caches that match the
            previous three classifiers are considered invalid.
            Any caches created after that time are fine.
          </p>
          <hr />
        </Col>
        <Col md={7}>
          <ButtonToolbar>
            <Button
              bsSize="sm"
              bsStyle="success"
              onClick={this.reload}
              disabled={!this.state.cachesLoaded}>
                <Glyphicon glyph="refresh" /> Refresh All
            </Button>
          </ButtonToolbar>
        </Col>
        <Col md={7}>
          <br /><br />
          {
            this.state.tableError ?
            <Alert bsStyle="danger" onDismiss={this.dismissError}>
              <strong>Error executing operation</strong> {this.state.tableError.toString()}
            </Alert> :
            this.renderCachesTable()
          }
        </Col>
        <Col md={5}>
          <br />
          {this.renderForm()}
        </Col>
      </Row>
    );
  },

  renderCachesTable() {
    try {
      return this.renderWaitFor('caches') || (
        <Table condensed hover>
          <thead>
            <tr>
              <th>Provisioner ID</th>
              <th>Worker Type</th>
              <th>Cache Name</th>
              <th>Before</th>
            </tr>
          </thead>
          <tbody>
            {this.state.caches.map(this.renderCacheRow)}
          </tbody>
        </Table>
      );
    } catch (e) {
      this.setState({ tableError: e });
    }
  },

  renderCacheRow(cache, index) {
    return (
      <tr key={index}>
        <td><code>{cache.provisionerId}</code></td>
        <td><code>{cache.workerType}</code></td>
        <td><code>{cache.cacheName}</code></td>
        <td><format.DateView date={cache.before}/></td>
      </tr>
    );
  },

  renderForm() {
    if (this.state.formError) {
      return (
        <Alert bsStyle="danger" onDismiss={this.dismissError}>
          <strong>Error executing operation</strong> {this.state.formError.toString()}
        </Alert>
      );
    }
    return (
      <div className="form-horizontal">
        <h4 style={{ marginTop: 7 }}>Create Purge Cache Request</h4>
        <hr style={{ marginBottom: 20 }}/>

        <FormGroup>
          <ControlLabel className="col-md-3">Provisioner ID</ControlLabel>
          <div className="col-md-9">
            <FormControl
              type="text"
              ref="provisionerId"
              placeholder="provisioner-id"
              value={this.state.formProvisionerId}
              onChange={this.provisionerIdChange} />
          </div>
        </FormGroup>

        <FormGroup>
          <ControlLabel className="col-md-3">Worker Type</ControlLabel>
          <div className="col-md-9">
            <FormControl
              type="text"
              ref="workerType"
              placeholder="worker-type"
              value={this.state.formProvisionerId}
              onChange={this.workerTypeChange} />
          </div>
        </FormGroup>

        <FormGroup>
          <ControlLabel className="col-md-3">Cache Name</ControlLabel>
          <div className="col-md-9">
            <FormControl
              type="text"
              ref="cacheName"
              placeholder="cache-name"
              value={this.state.formProvisionerId}
              onChange={this.cacheNameChange} />
          </div>
        </FormGroup>

        <p>Please note: The <code>before</code> date/time will be set to current date/time.</p>

        <ButtonToolbar>
          <Button
            bsStyle="primary"
            onClick={this.sendRequest}>
            <Glyphicon glyph="plus" /> Create request
          </Button>
        </ButtonToolbar>

      </div>
    );
  },

  provisionerIdChange(element) {
    this.setState({ formProvisionerId: element.value });
  },

  workerTypeChange(element) {
    this.setState({ formWorkerType: element.value });
  },

  cacheNameChange(element) {
    this.setState({ formCacheName: element.value });
  },

  async sendRequest() {
    try {
      await this.purgeCaches.purgeCache(
        findDOMNode(this.refs.provisionerId).value,
        findDOMNode(this.refs.workerType).value,
        { cacheName: findDOMNode(this.refs.cacheName).value }
      );
      this.setState({
        formProvisionerId: '',
        formWorkerType: '',
        formCacheName: ''
      });
      this.reload();
    } catch (e) {
      this.setState({ formError: e });
    }
  },

  dismissError() {
    this.setState({ formError: null, tableError: null });
  }
});
