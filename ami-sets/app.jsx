let React         = require('react');
let ReactDOM      = require('react-dom');
let AmiSetManager   = require('./amisetmanager');
let $             = require('jquery');
let utils         = require('../lib/utils');

var hashManager = utils.createHashManager({
  separator:            '/'
});

// Render component
$(function() {
  ReactDOM.render(
    <AmiSetManager hashEntry={hashManager.root()}/>,
    $('#container')[0]
  );
});
