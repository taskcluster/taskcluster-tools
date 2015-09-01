var React               = require('react');
var ClientManager       = require('./clientmanager');
var $                   = require('jquery');

// Render component
$(function() {
  React.render(
    <ClientManager/>,
    $('#container')[0]
  );
});
