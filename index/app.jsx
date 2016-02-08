let React                   = require('react');
let ReactDOM                = require('react-dom');
let $                       = require('jquery');
let bs                      = require('react-bootstrap');
let IndexBrowser            = require('./indexbrowser');
let EntryView               = require('./entryview');
let utils                   = require('../lib/utils');

var hashManager = utils.createHashManager({
  separator:            '/'
});

// Render component
$(function() {
  ReactDOM.render(
    (
      <IndexBrowser
        hashEntry={hashManager.root()}
        entryView={EntryView}
        hasHashEntry={false}/>
    ),
    $('#container')[0]
  );
});

