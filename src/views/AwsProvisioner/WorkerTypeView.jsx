import { PureComponent } from 'react';
import { func, string } from 'prop-types';
import { Nav, NavItem } from 'react-bootstrap';
import clone from 'lodash.clonedeep';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import Code from '../../components/Code';
import WorkerTypeEditor from './WorkerTypeEditor';
import WorkerTypeResources from './WorkerTypeResources';
import WorkerTypeStatus from './WorkerTypeStatus';
import UserSession from '../../auth/UserSession';

export default class WorkerTypeView extends PureComponent {
  static propTypes = {
    provisionerId: string.isRequired,
    workerType: string.isRequired,
    // Reload list of workerTypes
    reload: func.isRequired,
    // update the summary for this workerType
    updateSummary: func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      pendingTasks: null,
      workerType: null,
      awsState: null,
      error: null
    };
  }

  componentWillMount() {
    this.loadWorkerType(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.workerType !== this.props.workerType ||
      nextProps.provisionerId !== this.props.provisionerId ||
      UserSession.userChanged(this.props.userSession, nextProps.userSession)
    ) {
      if (this.state.error) {
        this.setState({ error: null }, () => this.loadWorkerType(nextProps));
      } else {
        this.loadWorkerType(nextProps);
      }
    }
  }

  async loadWorkerType({
    awsProvisioner,
    queue,
    workerType,
    updateSummary,
    provisionerId
  }) {
    try {
      this.setState({
        error: null,
        pendingTasks: await queue.pendingTasks(provisionerId, workerType),
        workerType: await awsProvisioner.workerType(workerType),
        awsState: await awsProvisioner.state(workerType).then(response => {
          updateSummary(workerType, response.summary);

          return response;
        })
      });
    } catch (err) {
      this.setState({
        error: err,
        pendingTasks: null,
        workerType: null,
        awsState: null
      });
    }
  }

  renderCurrentTab() {
    const { currentTab } = this.props;
    const { workerType, awsState } = this.state;

    if (currentTab === 'view') {
      return this.renderDefinition();
    }

    if (currentTab === 'edit') {
      return (
        <WorkerTypeEditor
          awsProvisioner={this.props.awsProvisioner}
          workerType={this.state.workerType.workerType}
          definition={this.state.workerType}
          updated={this.props.reload}
        />
      );
    }

    if (currentTab === 'resources') {
      return awsState ? (
        <WorkerTypeResources
          userSession={this.props.userSession}
          workerType={workerType}
          awsState={awsState}
          queue={this.props.queue}
          ec2BaseUrl={this.props.ec2BaseUrl}
        />
      ) : (
        <Spinner />
      );
    }

    return awsState ? (
      <WorkerTypeStatus workerType={workerType} awsState={awsState} />
    ) : (
      <Spinner />
    );
  }

  renderDefinition() {
    const definition = clone(this.state.workerType);

    return (
      <div>
        <br />
        <Code language="javascript">{JSON.stringify(definition, null, 2)}</Code>
      </div>
    );
  }

  render() {
    const { onSelect, currentTab } = this.props;
    const { error, workerType, pendingTasks } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (!workerType || !pendingTasks) {
      return <Spinner />;
    }

    return (
      <div>
        <Nav bsStyle="tabs" activeKey={`${currentTab}`} onSelect={onSelect}>
          <NavItem eventKey="" key="">
            Status
          </NavItem>
          <NavItem eventKey="view" key="view">
            View Definition
          </NavItem>
          <NavItem eventKey="edit" key="edit">
            Edit Definition
          </NavItem>
          <NavItem eventKey="resources" key="resources">
            EC2 Resources
          </NavItem>
        </Nav>
        <div className="tab-content" style={{ minHeight: 400 }}>
          <div className="tab-pane active">{this.renderCurrentTab()}</div>
        </div>
      </div>
    );
  }
}
