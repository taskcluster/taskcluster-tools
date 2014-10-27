/** @jsx React.DOM */
var React                   = require('react');
var $                       = require('jquery');
var bs                      = require('react-bootstrap');
var PulseInspector          = require('./pulseinspector');

// Render component
$(function() {
  React.renderComponent(
    (
      <PulseInspector/>
    ),
    $('#container')[0]
  );
});


