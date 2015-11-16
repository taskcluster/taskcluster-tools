var React         = require('react');
var HookManager   = require('./hookmanager');
var $             = require('jquery');
var utils         = require('../lib/utils');

var hashManager = utils.createHashManager({
  separator:            '/'
});

// Render component
$(function() {
  React.render(
    <HookManager hashEntry={hashManager.root()}/>,
    $('#container')[0]
  );
});
