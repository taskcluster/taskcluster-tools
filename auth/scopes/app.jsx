let React               = require('react');
let ReactDOM            = require('react-dom');
let ScopeInspector      = require('./scopeinspector');
let $                   = require('jquery');

var utils               = require('../../lib/utils');

var hashManager = utils.createHashManager({
  separator:            '/'
});

// Render component
$(function() {
  ReactDOM.render(
    <ScopeInspector hashEntry={hashManager.root()}/>,
    $('#container')[0]
  );
});
