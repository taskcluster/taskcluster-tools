let React                   = require('react');
let ReactDOM                = require('react-dom');
let $                       = require('jquery');
let CredentialsPreferences  = require('./credentialspreferences');
let bs                      = require('react-bootstrap');


// Render component
$(function() {
  ReactDOM.render(
    (
      <bs.Row>
        <bs.Col lg={6} lgOffset={3} md={8} mdOffset={2} sm={10} smOffset={1}>
          <h1>TaskCluster Tools Preferences</h1>
          <hr/>
          <CredentialsPreferences/>
        </bs.Col>
      </bs.Row>
    ),
    $('#container')[0]
  );
});


