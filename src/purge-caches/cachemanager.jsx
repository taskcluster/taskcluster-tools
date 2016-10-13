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
            this.state.tableError ? (
              <Alert bsStyle="danger" onDismiss={this.dismissError}>
                <strong>Error executing operation: </strong> {`${this.state.tableError}`}
              </Alert>
            ) :
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
    } catch (err) {
      this.setState({ tableError: err });
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
          <strong>Error executing operation: </strong> {`${this.state.formError}`}
        </Alert>
      );
    }

    return (
      <div className="form-horizontal">
        <h4 style={{ marginTop: 7 }}>Create Purge Cache Request</h4>
        <hr style={{ marginBottom: 20 }}/>

        <FormGroup>
          <ControlLabel className="col-md-3">Provisioner ID</ControlLabel>
          <Col md={9}>
            <FormControl
              type="text"
              ref="provisionerId"
              placeholder="Provisioner ID"
              value={this.state.formProvisionerId}
              onChange={this.provisionerIdChange} />
          </Col>
        </FormGroup>

        <FormGroup>
          <ControlLabel className="col-md-3">Worker Type</ControlLabel>
          <Col md={9}>
            <FormControl
              type="text"
              ref="workerType"
              placeholder="Worker type"
              value={this.state.formWorkerType}
              onChange={this.workerTypeChange} />
          </Col>
        </FormGroup>

        <FormGroup>
          <ControlLabel className="col-md-3">Cache Name</ControlLabel>
          <Col md={9}>
            <FormControl
              type="text"
              ref="cacheName"
              placeholder="Cache name"
              value={this.state.formCacheName}
              onChange={this.cacheNameChange} />
          </Col>
        </FormGroup>

        <p>Please note: The <code>before</code> date-time will be set to current date-time.</p>

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
    this.setState({ formProvisionerId: element.target.value });
  },

  workerTypeChange(element) {
    this.setState({ formWorkerType: element.target.value });
  },

  cacheNameChange(element) {
    this.setState({ formCacheName: element.target.value });
  },

  async sendRequest() {
    try {
      await this.purgeCaches.purgeCache(
        this.state.formProvisionerId,
        this.state.formWorkerType,
        { cacheName: this.state.formCacheName }
      );

      this.setState({
        formProvisionerId: '',
        formWorkerType: '',
        formCacheName: ''
      });
      this.reload();
    } catch (err) {
      this.setState({ formError: err });
    }
  },

  dismissError() {
    this.setState({ formError: null, tableError: null });
  }
});
