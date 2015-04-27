'use strict';
/** @jsx React.DOM */
var React           = require('react');
var bs              = require('react-bootstrap');

/** 
TODO:
  - List capacity for each instance/sr
  - Display spot bid and 'true price'
*/
var StatsTable = React.createClass({
  render: function() {
    var that = this;
    var header;
    if (this.props.isSpot) {
      header = (<tr>
        <th>Spot Request Id</th>
        <th>Instance Type</th>
        <th>Region</th>
        <th>AZ</th>
        <th>AMI</th>
        <th>Create Time</th>
      </tr>);
    } else {
      header = (<tr>
        <th>Instance Id</th>
        <th>Spot Request Id</th>
        <th>Instance Type</th>
        <th>Region</th>
        <th>AZ</th>
        <th>AMI</th>
        <th>Launch Time</th>
      </tr>);
    }
    return (
        <bs.Table striped bordered condensed hover>
          <thead>
          {header}
          </thead>
          {
            this.props.states.map(function(state) {
              if (that.props.isSpot) {
                return (<tr key={state.SpotInstanceRequestId}>
                  <td><b>{state.SpotInstanceRequestId}</b></td>
                  <td>{state.LaunchSpecification.InstanceType}</td>
                  <td>{state.Region}</td>
                  <td>{state.LaunchSpecification.Placement.AvailabilityZone}</td>
                  <td>{state.LaunchSpecification.ImageId}</td>
                  <td>{state.CreateTime}</td>
                </tr>);
              } else {
                return (<tr key={state.InstanceId}>
                  <td><b>{state.InstanceId}</b></td>
                  <td>{state.SpotInstanceRequestId}</td>
                  <td>{state.InstanceType}</td>
                  <td>{state.Region}</td>
                  <td>{state.Placement.AvailabilityZone}</td>
                  <td>{state.ImageId}</td> 
                  <td>{state.LaunchTime}</td>
                </tr>);
              }
            })
          }
        </bs.Table>
    );
  },
});

module.exports = StatsTable;
