let React        = require('react');
let ReactDOM     = require('react-dom');
let $            = require('jquery');
let credentials  = require('./credentials');
let bs           = require('react-bootstrap');


// Render component
$(function() {
  ReactDOM.render(<credentials.CredentialManager />,
    $('#container')[0]
  );
});
