var React                   = require('react');
var $                       = require('jquery');
var bs                      = require('react-bootstrap');
var PulseInspector          = require('./pulseinspector');
var utils                   = require('../lib/utils');

var hashManager = utils.createHashManager({
  separator:      '&'
});

// Render component
$(function() {
  React.render(
    (
      <PulseInspector hashEntry={hashManager.root()}/>
    ),
    $('#container')[0]
  );
});


