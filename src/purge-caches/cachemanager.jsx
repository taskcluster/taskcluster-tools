import React from 'react';
import { Row, Col, ButtonToolbar, Glyphicon, Table, Button } from 'react-bootstrap';
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
      cachesLoaded: false
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
        <Col md={12}>
          <ButtonToolbar className="pull-right">
            <Button
              bsSize="sm"
              bsStyle="success"
              onClick={this.reload}
              disabled={!this.state.cachesLoaded}>
                <Glyphicon glyph="refresh" /> Refresh All
            </Button>
          </ButtonToolbar>
        </Col>
        <Col md={12}>
          <br /><br />
          {this.renderCachesTable()}
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
      console.log(e);
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
  }
});
