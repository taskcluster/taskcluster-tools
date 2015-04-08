/** @jsx React.DOM */
var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var _               = require('lodash');
var format          = require('../lib/format');

/** 
 * We are doing this without the mixin for now because the client needs
 * to be created in a non-standard way.  This shouldn't be done this way
 * in production...
 */
/** BEGIN SUPER HACK */
var request = new XMLHttpRequest();
//request.open('GET', 'https://taskcluster-aws-provisioner2.herokuapp.com/v1/api-reference', false);
request.open('GET', 'http://localhost:5556/v1/api-reference', false);
request.send(null);
if (request.status === 200) {
  var reftxt = request.responseText;
  try {
    var reference = JSON.parse(reftxt);
    console.dir(reference);
  } catch(e) {
    console.log(e, e.stack);
    alert('Uh-oh, error: ' + e);
  }
} else {
  alert('Uh-oh, failed to load API reference');
}

var AwsProvisionerClient = taskcluster.createClient(reference);
/** END SUPER HACK */

// Questions:
//  1. Should I create a client for each react class or share the parent classes?
//  2. Why does the aws-provisioner not allow cross-origin requests?


var WorkerTypeTable = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        awsProvisioner: AwsProvisionerClient,
      }
    }),
  ],

  getInitialState: function() {
    return {
      workerTypes: [],
      workerTypesLoaded: true,
      workerTypesError: undefined,
      current: '',
    };
  },

  load: function() {
    return {
      workerTypes: this.awsProvisioner.listWorkerTypes(),
    };
  },
  
  render: function() {
    // TODO: Should write a note somewhere explaining what all these terms mean
    return (
      <bs.Table striped bordered condensed hover>
        <thead>
          <tr>
            <th>Worker Type Name</th>
            <th>Running Capacity</th>
            <th>Pending Capacity</th>
            <th>Requested Capacity</th>
            <th>Pending Tasks</th>
          </tr>
        </thead>
        <tbody>
        {
          this.renderWaitFor('workerTypes') || this.state.workerTypes.map(function(name) {
            return (<tr key={name}>
              <td>{name}</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
            </tr>);
          })
        }
        </tbody>
      </bs.Table>
    );
  },
});

var AwsProvisioner = React.createClass({
  mixins: [
    // Calls load()
    utils.createTaskClusterMixin({
      clients: {
        awsProvisioner:          taskcluster.Index
      },
    }),
  ],

  propTypes: {
  },

  getInitialState: function() {
    return {
      workerType: "",
    };
  },

  load: function() {
    return {
    };
  },

  render: function() {
    return (
        <WorkerTypeTable />
    );
  },

});

// Export IndexBrowser
module.exports = AwsProvisioner;
