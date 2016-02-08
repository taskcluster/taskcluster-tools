let React                   = require('react');
let ReactDOM                = require('react-dom');
let $                       = require('jquery');
let bs                      = require('react-bootstrap');
let utils                   = require('../lib/utils');
let WorkerTypeTable         = require('./workertypetable');

const PROVISIONER_ID = 'aws-provisioner-v1';

var hashManager = utils.createHashManager({
  separator:            '/'
});

// Render component
$(function() {
  ReactDOM.render(
    (
      <WorkerTypeTable
        provisionerId={PROVISIONER_ID}
        hashEntry={hashManager.root()}/>
    ),
    $('#container')[0]
  );
});

