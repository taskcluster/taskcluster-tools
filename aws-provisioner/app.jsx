var React                   = require('react');
var $                       = require('jquery');
var bs                      = require('react-bootstrap');
var AwsProvisioner          = require('./awsprovisioner');
var utils                   = require('../lib/utils');

// Render component
$(function() {
  React.render(
    (
      <AwsProvisioner />
    ),
    $('#container')[0]
  );
});

