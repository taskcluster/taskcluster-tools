var React                   = require('react');
var $                       = require('jquery');
var bs                      = require('react-bootstrap');
var utils                   = require('../lib/utils');
var WorkerTypeTable         = require('./workertypetable');

const PROVISIONER_ID = 'aws-provisioner-v1';

var hashManager = utils.createHashManager({
  separator:            '/'
});

// Render component
$(function() {
  React.render(
    (
      <WorkerTypeTable
        provisionerId={PROVISIONER_ID}
        hashEntry={hashManager.root()}
        />
    ),
    $('#container')[0]
  );
});

