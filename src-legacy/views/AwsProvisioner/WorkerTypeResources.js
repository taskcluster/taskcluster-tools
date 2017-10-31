import React from 'react';
import { object, shape, arrayOf } from 'prop-types';
import { Table } from 'react-bootstrap';
import Icon from 'react-fontawesome';
import DateView from '../../components/DateView';

const awsUrl = 'https://console.aws.amazon.com/ec2/v2/home';

export default class WorkerTypeResources extends React.PureComponent {
  static propTypes = {
    workerType: object.isRequired,
    awsState: shape({
      instances: arrayOf(object),
      requests: arrayOf(object)
    }).isRequired
  };

  getCapacityFor(stateKey, instanceState) {
    const { instanceTypes } = this.props.workerType;

    return this.props.awsState[stateKey].reduce((sum, instance) => {
      if (instanceState && instance.state !== instanceState) {
        return sum;
      }

      const type = instanceTypes.find(
        ({ instanceType }) => instanceType === instance.type
      );

      if (!type) {
        return sum;
      }

      return sum + instance.capacity;
    }, 0);
  }

  runningCapacity() {
    return this.getCapacityFor('instances', 'running');
  }

  pendingCapacity() {
    return this.getCapacityFor('instances', 'pending');
  }

  spotReqCapacity() {
    return this.getCapacityFor('requests');
  }

  renderInstanceRow = (instance, index) => (
    <tr key={index}>
      <td>{this.renderInstanceIdLink(instance.id, instance.region)}</td>
      <td>
        {this.renderSpotRequestLink(instance.srId, instance.region, true)}
      </td>
      <td>
        <code>{instance.type}</code>
      </td>
      <td>
        <code>{instance.zone}</code>
      </td>
      <td>{this.renderImageIdLink(instance.ami, instance.region)}</td>
      <td>
        <DateView date={new Date(instance.launch)} />
      </td>
    </tr>
  );

  renderSpotRow = (spotReq, index) => (
    <tr key={index}>
      <td>
        {this.renderSpotRequestLink(
          spotReq.id,
          spotReq.region,
          spotReq.visibleToEC2Api
        )}
      </td>
      <td>
        <code>{spotReq.type}</code>
      </td>
      <td>
        <code>{spotReq.zone}</code>
      </td>
      <td>
        <code>{spotReq.ami}</code>
      </td>
      <td>{this.renderImageIdLink(spotReq.ami, spotReq.region)}</td>
      <td>
        <DateView date={new Date(spotReq.time)} />
      </td>
    </tr>
  );

  renderInstanceIdLink(instanceId, region) {
    const qs = `?region=${region}#Instances:instanceId=${instanceId};sort=Name`;

    return (
      <a href={`${awsUrl}${qs}`} target="_blank" rel="noopener noreferrer">
        <code>{instanceId}</code>
        <i className="fa fa-external-link" style={{ paddingLeft: 5 }} />
      </a>
    );
  }

  renderSpotRequestLink(spotReqId, region, visibleToEC2) {
    const qs = `?region=${region}#SpotInstances:spotInstanceRequestId=${spotReqId};sort=requestId`;

    // API Visibility refers to the fact that the spot request has been made
    // but due to eventual consistency is not yet showing up in the
    // describe* EC2 API endpoints
    //
    // NOTE: only doing comparison to false instead of !visibleToEC2 for
    // deployment reasons since the API currently spits out 'undefined' for
    // both internally tracked and api tracked requests
    return (
      <a href={`${awsUrl}${qs}`} target="_blank" rel="noopener noreferrer">
        <code>{spotReqId}</code>
        {!visibleToEC2 ? ' (Internally tracked)' : ''}
        <Icon name="external-link" style={{ paddingLeft: 5 }} />
      </a>
    );
  }

  renderImageIdLink(imageId, region) {
    const qs = `?region=${region}#Images:visibility=owned-by-me;imageId=${imageId};sort=name`;

    return (
      <a href={`${awsUrl}${qs}`} target="_blank" rel="noopener noreferrer">
        <code>{imageId}</code>
        <Icon name="fa fa-external-link" style={{ paddingLeft: 5 }} />
      </a>
    );
  }

  render() {
    return (
      <span>
        <h3>Running Instances</h3>
        We have a total running instance capacity of {this.runningCapacity()}.
        These are instances that the provisioner counts as doing work.
        <Table>
          <thead>
            <tr>
              <th>Instance Id</th>
              <th>Spot Request Id</th>
              <th>Instance Type</th>
              <th>Availability Zone</th>
              <th>AMI</th>
              <th>Launch Time</th>
            </tr>
          </thead>
          <tbody>
            {this.props.awsState.instances
              .filter(x => x.state === 'running')
              .map(this.renderInstanceRow)}
          </tbody>
        </Table>
        <h3>Pending Instances</h3>
        We have a total pending instance capacity of {this.pendingCapacity()}.
        These are filled spot requests which are not yet doing work. These are
        usually instances which are booting up.
        <Table>
          <thead>
            <tr>
              <th>Instance Id</th>
              <th>Spot Request Id</th>
              <th>Instance Type</th>
              <th>Availability Zone</th>
              <th>Image Id</th>
              <th>Launch Time</th>
            </tr>
          </thead>
          <tbody>
            {this.props.awsState.instances
              .filter(x => x.state === 'pending')
              .map(this.renderInstanceRow)}
          </tbody>
        </Table>
        <h3>Spot Requests</h3>
        We have unfilled spot requests for a capacity of{' '}
        {this.spotReqCapacity()}. Amazon is yet to decide on the bid, or they
        have not told us the outcome yet.
        <Table>
          <thead>
            <tr>
              <th>Spot Request Id</th>
              <th>Instance Type</th>
              <th>Availability Zone</th>
              <th>Image Id</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>{this.props.awsState.requests.map(this.renderSpotRow)}</tbody>
        </Table>
      </span>
    );
  }
}
