let React = require('react');
let ReactDOM = require('react-dom');
let $ = require('jquery');
let bs = require('react-bootstrap');
let TaskGroupInspector = require('./taskgroupinspector');
let utils = require('../lib/utils');

let hashManager = utils.createHashManager({ separator: '/' });

// Render component
$(function() {
  ReactDOM.render(
    (
      <bs.Row style={{marginBottom: 50}}>
        <bs.Col md={10} mdOffset={1}>
          <TaskGroupInspector hashEntry={hashManager.root()}/>
        </bs.Col>
      </bs.Row>
    ),
    $('#container')[0]
  );
});
