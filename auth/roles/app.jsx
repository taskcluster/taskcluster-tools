let React               = require('react');
let ReactDOM            = require('react-dom');
let RoleManager         = require('./rolemanager');
let $                   = require('jquery');

var utils               = require('../../lib/utils');

var hashManager = utils.createHashManager({
  separator:            '/'
});

// Render component
$(function() {
  ReactDOM.render(
    <RoleManager hashEntry={hashManager.root()}/>,
    $('#container')[0]
  );
});

