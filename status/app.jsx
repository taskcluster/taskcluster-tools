var React                   = require('react');
var $                       = require('jquery');
var bs                      = require('react-bootstrap');
var ts       = require('./status');

// Render component
$(function() {
  React.render(<ts.TaskclusterDashboard/>, $('#container')[0]);
});

