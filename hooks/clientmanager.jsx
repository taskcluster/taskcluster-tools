var React           = require('react');
var bs              = require('react-bootstrap');
//var ClientEditor    = require('./clienteditor');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var format          = require('../lib/format');

var reference = require('./reference');

/** Create client manager */
var ClientManager = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        hooks:       taskcluster.createClient(reference)
      }
    })
  ],

  /** Create an initial state */
  getInitialState: function () {
    return {};
  },

  load: function () {
    return {};
  },

  render: function () {
    return (
      <bs.Row>
        <bs.Col md={6}>
          <bs.ButtonToolbar>
            <bs.Button bsStyle="primary">
              <bs.Glyphicon glyph="plus"/>
              &nbsp;
              Add Hook
            </bs.Button>
            <bs.Button bsStyle="success"
                       onClick={this.reload}>
              <bs.Glyphicon glyph="refresh"/>
              &nbsp;
              Refresh
            </bs.Button>
          </bs.ButtonToolbar>
        </bs.Col>
      </bs.Row>
    );
  }
});

// Export ClientManager
module.exports = ClientManager;
