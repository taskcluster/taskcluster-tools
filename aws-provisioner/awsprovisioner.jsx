/** @jsx React.DOM */
var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var _               = require('lodash');
var format          = require('../lib/format');

/** Generic Index Browser with a custom entryView */
var AwsProvisioner = React.createClass({
  mixins: [
    // Calls load()
    utils.createTaskClusterMixin({
      clients: {
        awsProvisioner:          taskcluster.Index
      },
      // Reload when state.namespace changes, ignore credentials changes
      reloadOnKeys:           ['workerType'],
      reloadOnLogin:          true
    }),
  ],

  propTypes: {
  },

  getInitialState: function() {
    return {
      workerType:       "",
    };
  },

  load: function() {
    return {
    };
  },

  render: function() {
    return (
        <p>Hello</p>
    );
  },

});

// Export IndexBrowser
module.exports = AwsProvisioner;
