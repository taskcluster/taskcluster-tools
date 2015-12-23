var React         = require('react');
var SecretManager = require('./secretmanager');
var $             = require('jquery');
var utils         = require('../lib/utils');

var hashManager = utils.createHashManager({
  separator:            '/'
});

// Render component
$(function() {
  React.render(
    <SecretManager/>,
    $('#container')[0]
  );
});
