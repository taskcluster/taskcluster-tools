let React               = require('react');
let ReactDOM            = require('react-dom');
let ClientManager       = require('./clientmanager');
let $                   = require('jquery');
let utils               = require('../../lib/utils');

var hashManager = utils.createHashManager({
  separator:            '/'
});

// Render component
$(function() {
  ReactDOM.render(
    <ClientManager hashEntry={hashManager.root()}/>,
    $('#container')[0]
  );
});
