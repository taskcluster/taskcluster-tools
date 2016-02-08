let React         = require('react');
let ReactDOM      = require('react-dom');
let HookManager   = require('./hookmanager');
let $             = require('jquery');
let utils         = require('../lib/utils');

var hashManager = utils.createHashManager({
  separator:            '/'
});

// Render component
$(function() {
  ReactDOM.render(
    <HookManager hashEntry={hashManager.root()}/>,
    $('#container')[0]
  );
});
