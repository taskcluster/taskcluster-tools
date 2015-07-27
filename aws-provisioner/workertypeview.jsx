var React             = require('react');
var bs                = require('react-bootstrap');
var utils             = require('../lib/utils');
var taskcluster       = require('taskcluster-client');
var _                 = require('lodash');
var format            = require('../lib/format');
var WorkerTypeEditor  = require('./workertypeeditor');


var WorkerTypeResources = React.createClass({
  propTypes: {
    workerType: React.PropTypes.object.isRequired,
    awsState: React.PropTypes.shape({
      running: React.PropTypes.arrayOf(React.PropTypes.object),
      pending: React.PropTypes.arrayOf(React.PropTypes.object),
      spotReq: React.PropTypes.arrayOf(React.PropTypes.object),
    }).isRequired
  },

  render() {
    return (
      <span>
        <h3>Running Instances</h3>
        We have&nbsp;
        {this.props.awsState.running.length}
        &nbsp;instances running with total capacity of {this.runningCapacity()}.
        <bs.Table>
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
            this.props.awsState.running.map(this.renderInstanceRow)
          }
          </tbody>
        </bs.Table>
        <h3>Pending Instances</h3>
        We have {this.props.awsState.pending.length}
        &nbsp;instances starting up with total capacity of&nbsp;
        {this.pendingCapacity()}.
        <bs.Table>
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
            this.props.awsState.pending.map(this.renderInstanceRow)
          }
          </tbody>
        </bs.Table>
        <h3>Spot Requests</h3>
        We have spot requests for&nbsp;
        {this.props.awsState.spotReq.length}
        &nbsp;instances with total capacity of {this.spotReqCapacity()}.
        <bs.Table>
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
          {
            this.props.awsState.spotReq.map(this.renderSpotRow)
          }
          </tbody>
        </bs.Table>
      </span>
    );
  },

  renderInstanceRow(instance, index) {
    var instanceLink = 'https://console.aws.amazon.com/ec2/v2/home?region=' +
                        instance.region + '#Instances:instanceId=' +
                        instance.id + ';sort=Name';
    return (
      <tr key={index}>
        <td>
          {this.renderInstanceIdLink(instance.id, instance.region)}
        </td>
        <td>
          {
            this.renderSpotRequestLink(
              instance.srId,
              instance.region
            )
          }
        </td>
        <td><code>{instance.type}</code></td>
        <td><code>{instance.zone}</code></td>
        <td>{this.renderImageIdLink(instance.ami, instance.region)}</td>
        <td>
          <format.DateView date={new Date(instance.launch)}/>
        </td>
      </tr>
    );
  },

  renderSpotRow(spotReq, index) {
    return (
      <tr key={index}>
        <td>
          {
            this.renderSpotRequestLink(
              spotReq.id,
              spotReq.region,
            )
          }
        </td>
        <td><code>{spotReq.type}</code></td>
        <td>
          <code>{spotReq.zone}</code>
        </td>
        <td><code>{spotReq.ami}</code></td>
        <td>
          {
            this.renderImageIdLink(
              spotReq.ami,
              spotReq.region
            )
          }
        </td>
        <td>
          <format.DateView date={new Date(spotReq.time)}/>
        </td>
      </tr>
    );
  },

  renderInstanceIdLink(instanceId, region) {
    var link = 'https://console.aws.amazon.com/ec2/v2/home?region=' +
                region + '#Instances:instanceId=' +
                instanceId + ';sort=Name';
    return (
      <a href={link}
         target='_blank'>
        <code>{instanceId}</code>
        <i className='fa fa-external-link' style={{paddingLeft: 5}}></i>
      </a>
    );
  },

  renderSpotRequestLink(spotRequestId, region) {
    var link = 'https://console.aws.amazon.com/ec2/v2/home?region=' +
                region + '#SpotInstances:spotInstanceRequestId=' +
                spotRequestId + ';sort=requestId';
    return (
      <a href={link}
         target='_blank'>
        <code>{spotRequestId}</code>
        <i className='fa fa-external-link' style={{paddingLeft: 5}}></i>
      </a>
    );
  },

  renderImageIdLink(imageId, region) {
    var link = 'https://console.aws.amazon.com/ec2/v2/home?region=' +
                region + '#Images:visibility=owned-by-me;imageId=' +
                imageId + ';sort=name';
    return (
      <a href={link}
         target='_blank'>
        <code>{imageId}</code>
        <i className='fa fa-external-link' style={{paddingLeft: 5}}></i>
      </a>
    );
  },

  runningCapacity() {
    return _.sum(this.props.awsState.running.map(instance => {
      return _.find(this.props.workerType.instanceTypes, {
        instanceType:     instance.type
      });
    }), 'capacity');
  },

  pendingCapacity() {
    return _.sum(this.props.awsState.pending.map(instance => {
      return _.find(this.props.workerType.instanceTypes, {
        instanceType:     instance.type
      });
    }), 'capacity');
  },

  spotReqCapacity() {
    return _.sum(this.props.awsState.spotReq.map(spotReq => {
      return _.find(this.props.workerType.instanceTypes, {
        instanceType:     spotReq.type
      });
    }), 'capacity');
  },
});

var WorkerTypeStatus = React.createClass({
  propTypes: {
    workerType: React.PropTypes.object.isRequired,
    awsState: React.PropTypes.shape({
      running: React.PropTypes.arrayOf(React.PropTypes.object),
      pending: React.PropTypes.arrayOf(React.PropTypes.object),
      spotReq: React.PropTypes.arrayOf(React.PropTypes.object),
    }).isRequired
  },

  render() {
    // Find availability zones
    var availabilityZones = _.union(
      this.props.awsState.running.map(_.property('zone')),
      this.props.awsState.pending.map(_.property('zone')),
      this.props.awsState.spotReq.map(_.property('zone'))
    );
    return (
      <bs.Table>
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
              this.props.workerType.instanceTypes.map(instTypeDef => {
                return availabilityZones.map(availabilityZone => {
                  return this.renderRow(instTypeDef, availabilityZone)
                });
              })
            )
          }
        </tbody>
      </bs.Table>
    );
  },

  renderRow(instTypeDef, availabilityZone) {
    // Find number of running, pending and spotRequests
    var running = this.props.awsState.running.filter(inst => {
      return inst.type === instTypeDef.instanceType &&
             inst.zone === availabilityZone;
    }).length;
    var pending = this.props.awsState.pending.filter(inst => {
      return inst.type === instTypeDef.instanceType &&
             inst.zone === availabilityZone;
    }).length;
    var spotReq = this.props.awsState.spotReq.filter(spotReq => {
      return spotReq.type === instTypeDef.instanceType &&
             spotReq.zone === availabilityZone;
    }).length;
    if (running + pending + spotReq === 0) {
      return undefined;
    }
    return (
      <tr key={instTypeDef.instanceType + ':' + availabilityZone}>
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
});

var WorkerTypeView = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        queue:          taskcluster.Queue,
        awsProvisioner: taskcluster.AwsProvisioner
      },
      clientOpts: {
        awsProvisioner: {
          baseUrl:      'https://aws-provisioner.taskcluster.net/v1'
        }
      },
      reloadOnProps: [
        'workerType',
        'provisionerId'
      ]
    }),
    utils.createLocationHashMixin({
      keys:           ['currentTab'],
      type:           'string'
    })
  ],

  propTypes: {
    provisionerId: React.PropTypes.string.isRequired,
    workerType: React.PropTypes.string.isRequired,
    awsState: React.PropTypes.shape({
      running: React.PropTypes.arrayOf(React.PropTypes.object),
      pending: React.PropTypes.arrayOf(React.PropTypes.object),
      spotReq: React.PropTypes.arrayOf(React.PropTypes.object),
    }).isRequired,
    // Reload list of workerTypes
    reload: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      currentTab: '',
      pendingTasks: {pendingTasks: 0},
      pendingTasksLoaded: false,
      pendingTasksError: undefined,
      workerType: {},
      workerTypeLoaded: false,
      workerTypeError: undefined
    };
  },

  load() {
    return {
      pendingTasks: this.queue.pendingTasks(
        this.props.provisionerId,
        this.props.workerType
      ),
      workerType: this.awsProvisioner.workerType(this.props.workerType)
    };
  },

  render() {
    return  this.renderWaitFor('workerType') ||
            this.renderWaitFor('pendingTasks') || (
      <div>
        <bs.Nav bsStyle="tabs"
                activeKey={'' + this.state.currentTab}
                onSelect={this.setCurrentTab}>
            <bs.NavItem eventKey={''} key={''}>Status</bs.NavItem>
            <bs.NavItem eventKey={'view'} key={'view'}>
              View Definition
            </bs.NavItem>
            <bs.NavItem eventKey={'edit'} key={'edit'}>
              Edit Definition
            </bs.NavItem>
            <bs.NavItem eventKey={'resources'} key={'resources'}>
              EC2 Resources
            </bs.NavItem>
        </bs.Nav>
        <div className="tab-content" style={{minHeight: 400}}>
          <div className="tab-pane active">
            {this.renderCurrentTab()}
          </div>
        </div>
      </div>
    );
  },

  setCurrentTab(tab) {
    // Update state
    this.setState({
      currentTab:     tab
    });
  },

  renderCurrentTab() {
    if (this.state.currentTab === 'view') {
      return this.renderDefinition();
    } else if (this.state.currentTab === 'edit') {
      return <WorkerTypeEditor
                workerType={this.state.workerType.workerType}
                definition={this.state.workerType}
                updated={this.props.reload}/>
    } else if (this.state.currentTab === 'resources') {
      return <WorkerTypeResources
                workerType={this.state.workerType}
                awsState={this.props.awsState}/>
    } else {
      return <WorkerTypeStatus
                workerType={this.state.workerType}
                awsState={this.props.awsState}/>
    }
  },

  renderDefinition() {
    var def = _.cloneDeep(this.state.workerType);
    return (
      <span>
        <br/>
        <format.Code language="javascript">
          {JSON.stringify(def, null, 2)}
        </format.Code>
      </span>
    );
  }
});


// Export WorkerTypeView
module.exports = WorkerTypeView;

