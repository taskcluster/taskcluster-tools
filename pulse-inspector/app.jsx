let React                   = require('react');
let ReactDOM                = require('react-dom');
let $                       = require('jquery');
let bs                      = require('react-bootstrap');
let PulseInspector          = require('./pulseinspector');
let utils                   = require('../lib/utils');

var hashManager = utils.createHashManager({
  separator:      '&'
});

// Render component
$(function() {
  ReactDOM.render(
    (
      <PulseInspector hashEntry={hashManager.root()}/>
    ),
    $('#container')[0]
  );
});


