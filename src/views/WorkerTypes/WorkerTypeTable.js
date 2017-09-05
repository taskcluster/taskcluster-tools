import React from 'react';
import { Table, Panel, Badge, Popover, OverlayTrigger, Label } from 'react-bootstrap';
import moment from 'moment';
import { func, string, bool, object } from 'prop-types';
import { find, propEq } from 'ramda';
import Icon from 'react-fontawesome';
import Spinner from '../../components/Spinner';
import Markdown from '../../components/Markdown';
import Error from '../../components/Error';
import styles from './styles.css';

const stabilityColors = {
  experimental: 'default',
  stable: 'success',
  deprecated: 'danger'
};

export default class WorkerTypeTable extends React.PureComponent {
  static propTypes = {
    queue: object,
    awsProvisioner: object,
    setOrderableProperties: func,
    provisionerId: string,
    orderBy: string,
    searchTerm: string,
    lastActive: bool
  };

  constructor(props) {
    super(props);

    this.state = {
      workerTypes: [],
      workerTypeSummaries: [],
      loading: false,
      error: null
    };
  }

  componentWillMount() {
    if (this.props.provisionerId) {
      this.loadWorkerTypes(this.props);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.provisionerId !== nextProps.provisionerId) {
      this.loadWorkerTypes(nextProps);
    }
  }

  async loadWorkerTypes({ provisionerId }, token) {
    this.setState({ workerTypes: [], loading: true, error: null }, async () => {
      try {
        const { workerTypes, continuationToken } = await this.props.queue
          .listWorkerTypes(provisionerId, token ? { continuationToken: token, limit: 100 } : { limit: 100 });

        this.setState({
          workerTypes: this.state.workerTypes ? this.state.workerTypes.concat(workerTypes) : workerTypes
        });

        if (continuationToken) {
          this.loadWorkerTypes(this.props, continuationToken);
        }

        const awsWorkerTypes = provisionerId === 'aws-provisioner-v1' ?
          await this.props.awsProvisioner.listWorkerTypeSummaries() :
          undefined;

        const workerTypesNormalized = this.state.workerTypes.map(workerType => (
          Object.assign(
            {},
            workerType,
            awsWorkerTypes ? find(propEq('workerType', workerType.workerType))(awsWorkerTypes) : {})
        ));

        const workerTypeSummaries = await Promise.all(workerTypesNormalized.map(async (workerType) => {
          const pendingTasks = await this.getPendingTasks(provisionerId, workerType.workerType);

          const stable = {
            provisionerId: workerType.provisionerId,
            workerType: workerType.workerType,
            pendingTasks,
            stability: workerType.stability,
            lastDateActive: workerType.lastDateActive
          };

          const dynamic = provisionerId === 'aws-provisioner-v1' ? {
            runningCapacity: workerType.runningCapacity,
            pendingCapacity: workerType.pendingCapacity
          } : undefined;

          return { ...stable, ...dynamic };
        }));

        this.props.setOrderableProperties(workerTypeSummaries[0]);
        this.setState({ workerTypeSummaries, error: null, loading: false });
      } catch (err) {
        this.setState({ workerTypeSummaries: [], error: err, loading: false });
      }
    });
  }

  async getPendingTasks(provisionerId, workerType) {
    const { pendingTasks } = await this.props.queue.pendingTasks(provisionerId, workerType);

    return pendingTasks;
  }

  renderDescription = ({ description }) => (
    <Popover id="popover-trigger-click-root-close" title="Description">
      {
        description ?
          <Markdown>{description}</Markdown> :
          <Markdown>`-`</Markdown>
      }
    </Popover>
  );

  renderGridWorkerType = (workerType, index) => {
    const description = this.renderDescription(workerType);
    const Header = () => (
      <div>
        <OverlayTrigger trigger="click" rootClose placement="right" overlay={description}>
          <div className="pull-right">
            <Icon role="button" name="info" />
          </div>
        </OverlayTrigger>
        <span>{workerType.workerType}</span>
      </div>
    );

    return (
      <Panel
        key={`worker-type-grid-${index}`}
        className={styles.card}
        header={<Header key={`worker-type-header-${index}`} />} bsStyle={`${stabilityColors[workerType.stability]}`}>
        <Table fill>
          <tbody>
            {
              this.props.provisionerId === 'aws-provisioner-v1' ?
                (['runningCapacity', 'pendingCapacity'].map((property, key) => (
                  <tr key={`dynamic-data-${key}`}>
                    <td>{property}</td>
                    <td><Badge>{workerType[property]}</Badge></td>
                  </tr>
                ))) :
                null
            }
            <tr>
              <td>Pending tasks</td>
              <td><Badge>{workerType.pendingTasks}</Badge></td>
            </tr>
            <tr>
              <td>Stability</td>
              <td>{workerType.stability}</td>
            </tr>
            <tr>
              <td>Last active</td>
              <td>{moment(workerType.lastDateActive).fromNow()}</td>
            </tr>
          </tbody>
        </Table>
      </Panel>
    );
  };

  renderTabularWorkerType = workerTypes => (
    <div className={styles.tabular}>
      <Table responsive>
        <thead>
          <tr>
            <th>Worker-type</th>
            <th>Stability</th>
            <th>Last active</th>
            <th>Pending tasks</th>
            {
              this.props.provisionerId === 'aws-provisioner-v1' ?
                (['runningCapacity', 'pendingCapacity'].map((property, index) => (
                  <th key={`tabular-dynamic-header-${index}`}>{property}</th>
                ))) :
                null
            }
          </tr>
        </thead>

        <tbody>
          {workerTypes.map((workerType, index) => (
            <tr key={`worker-type-tabular-${index}`}>
              <td>
                <OverlayTrigger trigger="click" rootClose placement="right" overlay={this.renderDescription(workerType)}>
                  <a role="button">{workerType.workerType}</a>
                </OverlayTrigger>
              </td>
              <td>
                <Label
                  bsStyle={stabilityColors[workerType.stability]}
                  style={{ borderRadius: 0, marginLeft: 10, marginBottom: 5 }}>
                  {workerType.stability}
                </Label>
              </td>
              <td>{moment(workerType.lastDateActive).fromNow()}</td>
              <td><Badge>{workerType.pendingTasks}</Badge></td>
              {
                this.props.provisionerId === 'aws-provisioner-v1' ?
                  (['runningCapacity', 'pendingCapacity'].map((property, index) => (
                    <td key={`tabular-dynamic-row-${index}`}><Badge>{workerType[property]}</Badge></td>
                  ))) :
                  null
              }
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  renderWorkerType = (workerTypes) => {
    if (this.props.gridLayout) {
      return workerTypes.map(this.renderGridWorkerType);
    }

    return this.renderTabularWorkerType(workerTypes);
  };

  sort = (a, b) => {
    if (this.props.lastActive) {
      return moment(a.lastDateActive).diff(moment(b.lastDateActive)) < 0 ? 1 : -1;
    }

    if (this.props.orderBy) {
      return a[this.props.orderBy] - b[this.props.orderBy] < 0 ? 1 : -1;
    }
  };

  render() {
    if (this.state.error) {
      return <Error error={this.state.error} />;
    }

    if (this.state.loading) {
      return <Spinner />;
    }

    if (!this.state.workerTypeSummaries.length) {
      return <div>No worker-types to display.</div>;
    }

    return (
      <div className={styles.container} >
        {this.renderWorkerType(
          this.state.workerTypeSummaries
            .filter(workerType => workerType.workerType.includes(this.props.searchTerm))
            .sort(this.sort)
        )}
      </div>
    );
  }
}
