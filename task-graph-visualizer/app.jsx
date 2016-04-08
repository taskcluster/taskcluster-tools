let React                   = require('react');
let ReactDOM                = require('react-dom');
let $                       = require('jquery');
let bs                      = require('react-bootstrap');
let TaskGraphVisualizer     = require('./taskgraphvisualizer');
let utils                   = require('../lib/utils');

var hashManager = utils.createHashManager({
  separator:            '/'
});

// Render component
$(function() {
  ReactDOM.render(
    (
      <bs.Row style={{marginBottom: 50}}>
        <bs.Col md={10} mdOffset={1}>
          <TaskGraphVisualizer hashEntry={hashManager.root()}/>
        </bs.Col>
      </bs.Row>
    ),
    $('#container')[0]
  );
});
