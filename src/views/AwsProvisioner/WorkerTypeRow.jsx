import { Component } from 'react';
import { string, shape, number, bool, func } from 'prop-types';
import { OverlayTrigger, ProgressBar, Tooltip } from 'react-bootstrap';
import Icon from 'react-fontawesome';

export default class WorkerTypeRow extends Component {
  static propTypes = {
    provisionerId: string.isRequired,
    workerType: shape({
      workerType: string.isRequired,
      minCapacity: number.isRequired,
      maxCapacity: number.isRequired,
      pendingCapacity: number.isRequired,
      runningCapacity: number.isRequired
    }).isRequired,
    selected: bool.isRequired,
    onClick: func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      pendingTasks: { pendingTasks: null },
      error: null
    };
  }

  componentWillMount() {
    this.loadPendingTasks(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.provisionerId !== this.props.provisionerId ||
      nextProps.workerType !== this.props.workerType
    ) {
      this.loadPendingTasks(nextProps);
    }
  }

  async loadPendingTasks({ queue, provisionerId, workerType }) {
    try {
      this.setState({
        pendingTasks: await queue.pendingTasks(
          provisionerId,
          workerType.workerType
        ),
        error: null
      });
    } catch (err) {
      this.setState({
        pendingTasks: null,
        error: err
      });
    }
  }

  renderCapacityBar() {
    const progress = this.doMath();
    const progressBars = [];

    if (progress.r) {
      progressBars.push(
        <ProgressBar
          bsStyle="success"
          key="running"
          now={progress.r}
          label={progress.rc}
        />
      );
    }

    if (progress.p) {
      progressBars.push(
        <ProgressBar
          bsStyle="warning"
          key="pending"
          now={progress.p}
          label={progress.pc}
        />
      );
    }

    return <ProgressBar>{progressBars}</ProgressBar>;
  }

  /* Return an object which has the fuzzed percentages to use for creating
   * progress bars and the unfuzzed capacities.  If we have a state with 0%, we
   * don't fuzz at all.  If we have 1-4%, we round to 5% and we don't fuzz
   * above 5% for the running and pending numbers */
  doMath() {
    // Actual capacities
    const runningCap = this.props.workerType.runningCapacity;
    const pendingCap = this.props.workerType.pendingCapacity;
    const maxCap = this.props.workerType.maxCapacity;
    // We want to make sure that if a bar is there that it's visible
    const smallestCapUnit = maxCap * 0.05;
    // Fuzz the percentages to make sure all bars are visible.  If we have a
    // state with 0%, we don't fuzz at all.  If we have 1-4%, we round to 5%
    // and we don't fuzz above 5%
    const fuzzedRunning = runningCap
      ? Math.max(runningCap, smallestCapUnit)
      : 0;
    const fuzzedPending = pendingCap
      ? Math.max(pendingCap, smallestCapUnit)
      : 0;
    // Determine the number which we should use to figure out our percentages.
    // When we have less than the max configured, we use that setting.  When we
    // exceed that amount, we want to sum up all the capacity units
    const count = fuzzedRunning + fuzzedPending;
    const divideBy = Math.max(maxCap, count);
    // Calculate the percentages to use for the bars.  These numbers are
    // invalid for other purposes
    const runPer = fuzzedRunning / divideBy;
    const pendPer = fuzzedPending / divideBy;

    return {
      r: runPer * 100,
      p: pendPer * 100,
      rc: runningCap,
      pc: pendingCap
    };
  }

  tooltip() {
    return (
      <Tooltip id={this.props.workerType.workerType}>
        {this.props.workerType.workerType} has running capacity to handle{' '}
        {this.props.workerType.runningCapacity || '0'} tasks and pending
        instances to handle {this.props.workerType.pendingCapacity || '0'}{' '}
        tasks.
      </Tooltip>
    );
  }

  renderState() {
    const { error, pendingTasks } = this.state;

    if (error) {
      const tooltip = (
        <Tooltip id="worker-type-row-loading-error">{error.message}</Tooltip>
      );

      return (
        <OverlayTrigger placement="left" overlay={tooltip}>
          <Icon name="exclamation-circle" />
        </OverlayTrigger>
      );
    }

    if (pendingTasks == null || pendingTasks.pendingTasks == null) {
      return <span>-</span>;
    }

    return <span>{pendingTasks.pendingTasks}</span>;
  }

  render() {
    return (
      <tr
        onClick={this.props.onClick}
        className={this.props.selected ? 'active' : null}
        style={{ cursor: 'pointer' }}>
        <td>
          <code>{this.props.workerType.workerType}</code>
        </td>
        <td>
          <OverlayTrigger placement="left" overlay={this.tooltip()}>
            {this.renderCapacityBar()}
          </OverlayTrigger>
        </td>
        <td>{this.renderState()}</td>
      </tr>
    );
  }
}
