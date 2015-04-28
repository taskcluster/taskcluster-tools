var React                   = require('react');
var $                       = require('jquery');
var CredentialsPreferences  = require('./credentialspreferences');
var bs                      = require('react-bootstrap');


// Render component
$(function() {
  React.render(
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


