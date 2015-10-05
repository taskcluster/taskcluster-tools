var React               = require('react');
var RoleManager         = require('./rolemanager');
var $                   = require('jquery');

var utils               = require('../../lib/utils');

var hashManager = utils.createHashManager({
  separator:            '/'
});

// Render component
$(function() {
  React.render(
    <RoleManager hashEntry={hashManager.root()}/>,
    $('#container')[0]
  );
});

