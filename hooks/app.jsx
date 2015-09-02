var React         = require('react');
var HookManager   = require('./hookmanager');
var $             = require('jquery');

// Render component
$(function() {
  React.render(
    <HookManager/>,
    $('#container')[0]
  );
});
