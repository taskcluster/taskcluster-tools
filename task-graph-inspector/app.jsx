var React                   = require('react');
var $                       = require('jquery');
var bs                      = require('react-bootstrap');
var TaskGraphInspector      = require('./taskgraphinspector');
var utils                   = require('../lib/utils');

var hashManager = utils.createHashManager({
  separator:            '/'
});

// Render component
$(function() {
  React.render(
    (
      <bs.Row style={{marginBottom: 50}}>
        <bs.Col md={10} mdOffset={1}>
          <TaskGraphInspector hashEntry={hashManager.root()}/>
        </bs.Col>
      </bs.Row>
    ),
    $('#container')[0]
  );
});

