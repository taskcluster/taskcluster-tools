let React = require('react');
let $     = require('jquery');
let bs    = require('react-bootstrap');
let ts    = require('./status');

// Render component
$(function() {
  React.render(<ts.TaskclusterDashboard/>, $('#container')[0]);
});

