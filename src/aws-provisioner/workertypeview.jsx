import React, {Component} from 'react';
import {Table, Nav, NavItem} from 'react-bootstrap';
import path from 'path';
import {TaskClusterEnhance} from '../lib/utils';
import taskcluster from 'taskcluster-client';
import * as _ from 'lodash';
import * as format from '../lib/format';
import WorkerTypeEditor from './workertypeeditor';

const URL = 'https://console.aws.amazon.com/ec2/v2/home';

class WorkerTypeResources extends Component {
  constructor(props) {
    super(props);

    this.renderInstanceRow = this.renderInstanceRow.bind(this);
    this.renderSpotRow = this.renderSpotRow.bind(this);
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
            {
              this.props.awsState.instances
                .filter(x => x.state === 'running')
                .map(this.renderInstanceRow)
            }
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
            {
              this.props.awsState.instances
                .filter(x => x.state === 'pending')
                .map(this.renderInstanceRow)
            }
          </tbody>
        </Table>
        <h3>Spot Requests</h3>
        We have unfilled spot requests for a capacity of {this.spotReqCapacity()}.
        Amazon is yet to decide on the bid, or they have not told us the outcome yet.
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
          <tbody>
            {this.props.awsState.requests.map(this.renderSpotRow)}
          </tbody>
        </Table>
      </span>
    );
  }

  renderInstanceRow(instance, index) {
    return (
      <tr key={index}>
        <td>
          {this.renderInstanceIdLink(instance.id, instance.region)}
        </td>
        <td>
          {this.renderSpotRequestLink(instance.srId, instance.region, true)}
        </td>
        <td><code>{instance.type}</code></td>
        <td><code>{instance.zone}</code></td>
        <td>{this.renderImageIdLink(instance.ami, instance.region)}</td>
        <td>
          <format.DateView date={new Date(instance.launch)} />
        </td>
      </tr>
    );
  }

  renderSpotRow(spotReq, index) {
    return (
      <tr key={index}>
        <td>
          {this.renderSpotRequestLink(spotReq.id, spotReq.region, spotReq.visibleToEC2Api)}
        </td>
        <td><code>{spotReq.type}</code></td>
        <td>
          <code>{spotReq.zone}</code>
        </td>
        <td><code>{spotReq.ami}</code></td>
        <td>
          {this.renderImageIdLink(spotReq.ami, spotReq.region)}
        </td>
        <td>
          <format.DateView date={new Date(spotReq.time)} />
        </td>
      </tr>
    );
  }

  renderInstanceIdLink(instanceId, region) {
    const qs = `?region=${region}#Instances:instanceId=${instanceId};sort=Name`;

    return (
      <a href={`${URL}${qs}`} target="_blank" rel="noopener noreferrer">
        <code>{instanceId}</code>
        <i className="fa fa-external-link" style={{paddingLeft: 5}} />
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
      <a href={`${URL}${qs}`} target="_blank" rel="noopener noreferrer">
        <code>{spotReqId}</code>{!visibleToEC2 ? ' (Internally tracked)' : ''}
        <i className="fa fa-external-link" style={{paddingLeft: 5}} />
      </a>
    );
  }

  renderImageIdLink(imageId, region) {
    const qs = `?region=${region}#Images:visibility=owned-by-me;imageId=${imageId};sort=name`;

    return (
      <a href={`${URL}${qs}`} target="_blank" rel="noopener noreferrer">
        <code>{imageId}</code>
        <i className="fa fa-external-link" style={{paddingLeft: 5}} />
      </a>
    );
  }

  runningCapacity() {
    const {instanceTypes} = this.props.workerType;
    const instances = this.props.awsState.instances
      .filter(x => x.state === 'running')
      .map(instance => _.find(instanceTypes, {instanceType: instance.type}));

    return _.sumBy(instances, 'capacity');
  }

  pendingCapacity() {
    const {instanceTypes} = this.props.workerType;
    const instances = this.props.awsState.instances
      .filter(x => x.state === 'pending')
      .map(instance => _.find(instanceTypes, {instanceType: instance.type}));

    return _.sumBy(instances, 'capacity');
  }

  spotReqCapacity() {
    const {instanceTypes} = this.props.workerType;
    const instances = this.props.awsState.requests
      .map(spotReq => _.find(instanceTypes, {instanceType: spotReq.type}));

    return _.sumBy(instances, 'capacity');
  }
}

WorkerTypeResources.propTypes = {
  workerType: React.PropTypes.object.isRequired,
  awsState: React.PropTypes.shape({
    instances: React.PropTypes.arrayOf(React.PropTypes.object),
    requests: React.PropTypes.arrayOf(React.PropTypes.object),
  }).isRequired
};

class WorkerTypeStatus extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    // Find availability zones
    const availabilityZones = _.union(
      this.props.awsState.instances.map(_.property('zone')),
      this.props.awsState.requests.map(_.property('zone'))
    );

    return (
      <Table>
        <thead>
          <tr>
            <th>Instance Type</th>
            <th>Availability Zone</th>
            <th>Running Capacity</th>
            <th>Pending Capacity</th>
            <th>Requested Spot Capacity</th>
          </tr>
        </thead>
        <tbody>
          {
            _.flatten(
              this.props.workerType.instanceTypes
                .map(instTypeDef => availabilityZones
                  .map(availabilityZone => this.renderRow(instTypeDef, availabilityZone))))
          }
        </tbody>
      </Table>
    );
  }

  renderRow(instTypeDef, availabilityZone) {
    // Find number of running, pending and spotRequests
    const running = this.props.awsState.instances
      .filter(inst => inst.type === instTypeDef.instanceType &&
        inst.state === 'running' &&
        inst.zone === availabilityZone
      )
      .length;
    const pending = this.props.awsState.instances
      .filter(inst => inst.type === instTypeDef.instanceType &&
        inst.state === 'pending' &&
        inst.zone === availabilityZone
      )
      .length;
    const spotReq = this.props.awsState.requests
      .filter(spotReq => spotReq.type === instTypeDef.instanceType &&
        spotReq.zone === availabilityZone
      )
      .length;
    if (running + pending + spotReq === 0) {
      return;
    }

    return (
      <tr key={`${instTypeDef.instanceType}:${availabilityZone}`}>
        <td><code>{instTypeDef.instanceType}</code></td>
        <td><code>{availabilityZone}</code></td>
        <td>
          {running * instTypeDef.capacity} ({running} instances)
        </td>
        <td>
          {pending * instTypeDef.capacity} ({pending} instances)
        </td>
        <td>
          {spotReq * instTypeDef.capacity} ({spotReq} instances)
        </td>
      </tr>
    );
  }
}

WorkerTypeStatus.propTypes = {
  workerType: React.PropTypes.object.isRequired,
  awsState: React.PropTypes
    .shape({
      instances: React.PropTypes.arrayOf(React.PropTypes.object),
      requests: React.PropTypes.arrayOf(React.PropTypes.object),
    })
    .isRequired
};

class WorkerTypeView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentTab: this.props.match.params.currentTab || '',
      pendingTasks: {pendingTasks: 0},
      pendingTasksLoaded: false,
      pendingTasksError: null,
      workerType: {},
      workerTypeLoaded: false,
      workerTypeError: null,
      awsState: {},
      awsStateLoaded: false,
      awsStateError: null
    };

    this.setCurrentTab = this.setCurrentTab.bind(this);
    this.load = this.load.bind(this);
    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
  }

  componentWillMount() {
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.addEventListener('taskcluster-reload', this.load, false);

    this.load();
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.removeEventListener('taskcluster-reload', this.load, false);
  }


  componentDidUpdate(prevProps, prevState) {
    this.props.taskclusterState(this.state, this.props);
  }

  onTaskClusterUpdate({detail}) {
    if (detail.name !== this.constructor.name) {
      return;
    }

    this.setState(detail.state);
  }

  load(data) {
    if (typeof data === 'object' && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    const self = this;
    const promisedState = {
      pendingTasks: this.props.clients.queue.pendingTasks(this.props.provisionerId, this.props.workerType),
      workerType: this.props.clients.awsProvisioner.workerType(this.props.workerType),
      awsState: this.props.clients.awsProvisioner
        .state(this.props.workerType)
        .then(res => {
          self.props.updateSummary(self.props.workerType, res.summary);

          return res;
        })
    };

    this.props.loadState(promisedState);
  }

  render() {
    return this.props.renderWaitFor('workerType') || this.props.renderWaitFor('pendingTasks') || (
      <div>
        <Nav bsStyle="tabs" activeKey={`${this.state.currentTab}`} onSelect={this.setCurrentTab}>
          <NavItem eventKey="" key="">Status</NavItem>
          <NavItem eventKey="view" key="view">View Definition</NavItem>
          <NavItem eventKey="edit" key="edit">Edit Definition</NavItem>
          <NavItem eventKey="resources" key="resources">EC2 Resources</NavItem>
        </Nav>
        <div className="tab-content" style={{minHeight: 400}}>
          <div className="tab-pane active">
            {this.renderCurrentTab()}
          </div>
        </div>
      </div>
    );
  }

  setCurrentTab(tab) {
    // Update state
    this.setState({currentTab: tab});
    this.props.history.push(path.join('/aws-provisioner', this.props.match.params.workerType, tab));
  }

  renderCurrentTab() {
    if (this.state.currentTab === 'view') {
      return this.renderDefinition();
    } else if (this.state.currentTab === 'edit') {
      return (
        <WorkerTypeEditor
          workerType={this.state.workerType.workerType}
          definition={this.state.workerType}
          updated={this.props.reload} />
      );
    } else if (this.state.currentTab === 'resources') {
      return this.props.renderWaitFor('awsState') || (
        <WorkerTypeResources
          workerType={this.state.workerType}
          awsState={this.state.awsState} />
      );
    }

    return this.props.renderWaitFor('awsState') || (
      <WorkerTypeStatus
        workerType={this.state.workerType}
        awsState={this.state.awsState} />
    );
  }

  renderDefinition() {
    const def = _.cloneDeep(this.state.workerType);

    return (
      <div>
        <br />
        <format.Code language="javascript">
          {JSON.stringify(def, null, 2)}
        </format.Code>
      </div>
    );
  }
}

WorkerTypeView.propTypes = {
  provisionerId: React.PropTypes.string.isRequired,
  workerType: React.PropTypes.string.isRequired,
  // Reload list of workerTypes
  reload: React.PropTypes.func.isRequired,
  // update the summary for this workerType
  updateSummary: React.PropTypes.func.isRequired
};

const taskclusterOpts = {
  clients: {
    queue: taskcluster.Queue,
    awsProvisioner: taskcluster.AwsProvisioner
  },
  clientOpts: {
    awsProvisioner: {
      baseUrl: 'https://aws-provisioner.taskcluster.net/v1'
    },
  },
  reloadOnProps: [
    'workerType',
    'provisionerId'
  ],
  name: WorkerTypeView.name
};

export default TaskClusterEnhance(WorkerTypeView, taskclusterOpts);
