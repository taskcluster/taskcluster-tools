let $ = require('jquery');
var React = require('react');
let Efficiency = require('./efficiency');

$(function() {
  React.render(
    (
      <Efficiency />
    ),
    $('#container')[0]
  );
});


//$('#container')[0]