import { Component } from 'react';
import { object, shape, arrayOf } from 'prop-types';
import { Table } from 'react-bootstrap';

export default class WorkerTypeStatus extends Component {
  static propTypes = {
    workerType: object.isRequired,
    awsState: shape({
      instances: arrayOf(object),
      requests: arrayOf(object)
    }).isRequired
  };

  renderRow(instTypeDef, availabilityZone) {
    // Find number of running and pending
    const running = this.props.awsState.instances.filter(
      inst =>
        inst.type === instTypeDef.instanceType &&
        inst.state === 'running' &&
        inst.zone === availabilityZone
    ).length;
    const pending = this.props.awsState.instances.filter(
      inst =>
        inst.type === instTypeDef.instanceType &&
        inst.state === 'pending' &&
        inst.zone === availabilityZone
    ).length;

    if (running + pending === 0) {
      return;
    }

    return (
      <tr key={`${instTypeDef.instanceType}:${availabilityZone}`}>
        <td>
          <code>{instTypeDef.instanceType}</code>
        </td>
        <td>
          <code>{availabilityZone}</code>
        </td>
        <td>
          {running * instTypeDef.capacity} ({running} instances)
        </td>
        <td>
          {pending * instTypeDef.capacity} ({pending} instances)
        </td>
      </tr>
    );
  }

  render() {
    const availabilityZones = [
      ...new Set([
        ...this.props.awsState.instances.map(({ zone }) => zone),
        ...this.props.awsState.requests.map(({ zone }) => zone)
      ])
    ];

    return (
      <Table>
        <thead>
          <tr>
            <th>Instance Type</th>
            <th>Availability Zone</th>
            <th>Running Capacity</th>
            <th>Pending Capacity</th>
          </tr>
        </thead>
        <tbody>
          {this.props.workerType.instanceTypes.reduce(
            (reduction, typeDef) =>
              reduction.concat(
                availabilityZones.map(zone => this.renderRow(typeDef, zone))
              ),
            []
          )}
        </tbody>
      </Table>
    );
  }
}
