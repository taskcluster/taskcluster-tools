var React            = require('react');
var bs               = require('react-bootstrap');
var utils            = require('../lib/utils');
let format           = require('../lib/format');
var taskcluster      = require('taskcluster-client');

var CacheManager = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        purgeCaches:       taskcluster.PurgeCache
      }
    }),
  ],

  /** Create an initial state */
  getInitialState() {
    return {
      caches: undefined,
      cachesLoaded: false,
    };
  },

  load() {
    return {
      caches: this.purgeCaches.allPurgeRequests().then((resp) => resp.requests)
    };
  },

  /** Render the main layout of the cache manager page */
  render() {
    return (
      <bs.Row>
        <bs.Col md={8}>
          <p>All currently active cache purges are displayed below. 24 hours after creation, requests expire and are no longer displayed here. The <strong>before</strong> column is the time at which any caches that match the previous three classifiers are considered invalid. Any caches created after that time are fine.</p>
        </bs.Col>
        <bs.Col md={4}>
          <bs.ButtonToolbar>
            <bs.Button bsStyle="success"
                       onClick={this.reload}
                       disabled={!this.state.cachesLoaded}>
              <bs.Glyphicon glyph="refresh"/>
              &nbsp;
              Refresh All
            </bs.Button>
          </bs.ButtonToolbar>
        </bs.Col>
        <bs.Col md={12}>
          {this.renderCachesTable()}
        </bs.Col>
      </bs.Row>
    );
  },

  renderCachesTable() {
    try {
      return this.renderWaitFor('caches') || (
        <bs.Table condensed hover>
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
        </bs.Table>
      );
    }
    catch(e) {
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
  },
})

module.exports = CacheManager;
