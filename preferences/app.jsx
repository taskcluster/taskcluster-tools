/** @jsx React.DOM */
var React                   = require('react');
var layout                  = require('../lib/layout');
var $                       = require('jquery');
var CredentialsPreferences  = require('./credentialspreferences');

// Render component
$(function() {
  layout.renderNavigation({
    activePage:   '/preferences'      // Matching entry in menu.js
  });
  React.renderComponent(
    <CredentialsPreferences/>,
    $('#container')[0]
  );
});


