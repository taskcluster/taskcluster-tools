var React                   = require('react');
var $                       = require('jquery');
var bs                      = require('react-bootstrap');
var IndexBrowser            = require('../indexbrowser');
var EntryView               = require('./entryview');
var utils                   = require('../../lib/utils');

var hashManager = utils.createHashManager({
  separator:            '/'
});

// Render component
$(function() {
  React.render(
    (
      <IndexBrowser
        hashEntry={hashManager.root()}
        entryView={EntryView}
        hasHashEntry={false}/>
    ),
    $('#container')[0]
  );
});

