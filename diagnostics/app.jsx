var ReactDOM    = require('react-dom');
var Diagnostics = require('./diagnostics');
var $           = require('jquery');
var bs          = require('react-bootstrap');
var React       = require('react');

$(function(){
  ReactDOM.render(
    <Diagnostics/>,
    $('#container')[0]
  );
})
