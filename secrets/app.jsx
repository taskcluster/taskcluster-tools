let React         = require('react');
let ReactDOM      = require('react-dom');
let SecretManager = require('./secretmanager');
let $             = require('jquery');
let utils         = require('../lib/utils');

var hashManager = utils.createHashManager({
  separator:            '/'
});

// Render component
$(function() {
  ReactDOM.render(
    <SecretManager/>,
    $('#container')[0]
  );
});
