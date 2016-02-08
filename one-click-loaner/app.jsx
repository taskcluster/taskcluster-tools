let React                   = require('react');
let ReactDOM                = require('react-dom');
let bs                      = require('react-bootstrap');
let OneClickLoaner          = require('./one-click-loaner');
let utils                   = require('../lib/utils');
let $                       = require('jquery');

let hashManager = utils.createHashManager({
  separator:            '/'
});

// Render component
$(function() {
  ReactDOM.render(
    (
      <bs.Row style={{marginBottom: 50}}>
        <bs.Col md={8} mdOffset={2}>
          <OneClickLoaner hashEntry={hashManager.root()}/>
        </bs.Col>
      </bs.Row>
    ),
    $('#container')[0]
  );
});
