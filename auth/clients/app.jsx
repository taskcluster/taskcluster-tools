var React               = require('react');
var ClientManager       = require('./clientmanager');
var $                   = require('jquery');
var utils               = require('../../lib/utils');

var hashManager = utils.createHashManager({
  separator:            '/'
});

// Render component
$(function() {
  React.render(
    <ClientManager hashEntry={hashManager.root()}/>,
    $('#container')[0]
  );
});
