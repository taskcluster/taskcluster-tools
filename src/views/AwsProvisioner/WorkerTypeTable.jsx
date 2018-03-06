import { PureComponent } from 'react';
import { string } from 'prop-types';
import { ButtonToolbar, Button, Glyphicon, Table } from 'react-bootstrap';
import WorkerTypeView from './WorkerTypeView';
import WorkerTypeEditor from './WorkerTypeEditor';
import WorkerTypeRow from './WorkerTypeRow';
import Spinner from '../../components/Spinner';
import Error from '../../components/Error';
import HelmetTitle from '../../components/HelmetTitle';
import { workerTypes } from './styles.module.css';
import UserSession from '../../auth/UserSession';

const defaultWorkerType = {
  minCapacity: 0,
  maxCapacity: 5,
  scalingRatio: 0,
  minPrice: 0,
  maxPrice: 0.6,
  canUseOndemand: false,
  canUseSpot: true,
  instanceTypes: [
    {
      instanceType: 'c3.xlarge',
      capacity: 1,
      utility: 1,
      secrets: {},
      scopes: [],
      userData: {},
      launchSpec: {}
    }
  ],
  regions: [
    {
      region: 'us-west-2',
      secrets: {},
      scopes: [],
      userData: {},
      launchSpec: {
        ImageId: 'ami-xx'
      }
    }
  ],
  userData: {},
  launchSpec: {},
  secrets: {},
  scopes: []
};

export default class WorkerTypeTable extends PureComponent {
  static propTypes = {
    provisionerId: string.isRequired
  };

  static defaultProps = {
    currentTab: ''
  };

  constructor(props) {
    super(props);

    this.state = {
      workerTypeSummaries: [],
      workerTypeContains: '',
      error: null
    };
  }

  componentWillMount() {
    this.loadWorkerTypeSummaries();
  }

  componentWillReceiveProps(nextProps) {
    if (
      UserSession.userChanged(this.props.userSession, nextProps.userSession)
    ) {
      this.setState({ error: null });
    }

    if (
      nextProps.provisionerId !== this.props.provisionerId ||
      nextProps.workerType !== this.props.workerType
    ) {
      this.loadWorkerTypeSummaries();
    }
  }

  async loadWorkerTypeSummaries() {
    try {
      this.setState({
        workerTypeSummaries: await this.props.awsProvisioner.listWorkerTypeSummaries(),
        error: null
      });
    } catch (err) {
      this.setState({
        workerTypeSummaries: null,
        error: err
      });
    }
  }

  setSelected = workerType =>
    this.props.history.replace(
      `${this.props.routeRoot}/${workerType}/${this.props.currentTab}`
    );

  handleTabChange = tab =>
    this.props.history.replace(
      `${this.props.routeRoot}/${this.props.workerType}/${tab}`
    );

  workerTypeCreated = async workerType => {
    await this.loadWorkerTypeSummaries();

    this.setSelected(workerType);
  };

  // work around https://github.com/taskcluster/aws-provisioner/pull/70
  updateSummary = (workerType, summary) =>
    this.setState({
      workerTypeSummaries: this.state.workerTypeSummaries.map(
        workerType =>
          workerType.workerType === workerType
            ? Object.assign(summary, { workerType })
            : workerType
      )
    });

  handleSetWorkerType = e =>
    this.setState({ workerTypeContains: e.target.value });

  handleEnterWorkerType = e => {
    if (e.keyCode === 13) {
      e.preventDefault();
      this.handleSetWorkerType(e);
    }
  };

  renderTypeInput() {
    return (
      <div className="form-group form-group-sm">
        <div className="input-group">
          <div className="input-group-addon text-sm">
            <em>WorkerTypes containing</em>
          </div>
          <input
            type="search"
            className="form-control"
            defaultValue={this.state.workerTypeContains}
            onBlur={this.handleSetWorkerType}
            onKeyUp={this.handleEnterWorkerType}
          />
          <div className="input-group-addon">
            <Glyphicon glyph="search" />
          </div>
        </div>
      </div>
    );
  }

  renderWorkerTypeView() {
    if (
      !this.state.workerTypeSummaries.find(
        summary => summary.workerType === this.props.workerType
      )
    ) {
      return null;
    }

    return (
      <div style={{ marginBottom: 40 }}>
        <h4>
          Worker Type: <code>{this.props.workerType}</code>
        </h4>
        <hr />
        <WorkerTypeView
          queue={this.props.queue}
          awsProvisioner={this.props.awsProvisioner}
          onSelect={this.handleTabChange}
          currentTab={this.props.currentTab}
          provisionerId={this.props.provisionerId}
          workerType={this.props.workerType}
          reload={this.setSelected}
          updateSummary={this.updateSummary}
          userSession={this.props.userSession}
          ec2BaseUrl={this.props.ec2BaseUrl}
        />
      </div>
    );
  }

  renderWorkerTypeCreator() {
    return (
      <div style={{ marginBottom: 50 }}>
        <hr />
        <h2>Create New WorkerType</h2>
        <WorkerTypeEditor
          awsProvisioner={this.props.awsProvisioner}
          definition={defaultWorkerType}
          updated={this.workerTypeCreated}
        />
      </div>
    );
  }

  renderState() {
    if (this.state.error) {
      return <Error error={this.state.error} />;
    }

    if (!this.state.workerTypeSummaries) {
      return <Spinner />;
    }

    return (
      <div>
        <h4>Worker Types</h4>
        {this.renderTypeInput()}
        <Table style={{ marginTop: 20 }}>
          <thead>
            <tr>
              <th className="col-xs-2">WorkerType</th>
              <th>Capacity</th>
              <th className="col-xs-2">Pending Tasks</th>
            </tr>
          </thead>
          <tbody>
            {this.state.workerTypeSummaries &&
              this.state.workerTypeSummaries
                .filter(workerType =>
                  workerType.workerType.includes(this.state.workerTypeContains)
                )
                .map(workerType => (
                  <WorkerTypeRow
                    queue={this.props.queue}
                    key={workerType.workerType}
                    provisionerId={this.props.provisionerId}
                    workerType={workerType}
                    selected={this.props.workerType === workerType.workerType}
                    onClick={() => this.setSelected(workerType.workerType)}
                    summary={workerType}
                  />
                ))}
          </tbody>
        </Table>
      </div>
    );
  }

  render() {
    return (
      <div className={workerTypes}>
        <HelmetTitle title="AWS Provisioner" />
        {this.props.workerType === 'create:worker-type'
          ? this.renderWorkerTypeCreator()
          : this.renderWorkerTypeView()}
        <ButtonToolbar className="pull-right">
          <Button
            bsStyle="primary"
            bsSize="sm"
            onClick={() => this.setSelected('create:worker-type')}
            style={{ marginTop: -10, padding: '3px 12px' }}>
            <Glyphicon glyph="plus" /> Create WorkerType
          </Button>
        </ButtonToolbar>
        <div>{this.renderState()}</div>
      </div>
    );
  }
}
