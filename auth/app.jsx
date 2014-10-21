/** @jsx React.DOM */
var React               = require('react');
var bs                  = require('react-bootstrap');
var layout              = require('../lib/layout');
var ClientManager       = require('./clientmanager');
var $                   = require('jquery');

// Render component
$(function() {
  layout.renderNavigation({activePage: '/auth'});
  React.renderComponent(
    <ClientManager/>,
    $('#container')[0]
  );
});

