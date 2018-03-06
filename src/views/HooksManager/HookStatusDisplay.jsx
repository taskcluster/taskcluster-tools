import { PureComponent } from 'react';
import { string, object, func } from 'prop-types';
import { Button, Glyphicon } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Spinner from '../../components/Spinner';
import DateView from '../../components/DateView';

export default class HookStatusDisplay extends PureComponent {
  static propTypes = {
    hookId: string.isRequired,
    hookGroupId: string.isRequired,
    hookStatus: object,
    onRefreshHookStatus: func.isRequired
  };

  renderLastTime() {
    const { hookStatus } = this.props;

    if (hookStatus.lastFire.result === 'no-fire') {
      return <span className="text-muted">Never Fired</span>;
    }

    return <DateView date={hookStatus.lastFire.time} />;
  }

  renderLastResult() {
    const { hookStatus } = this.props;

    if (hookStatus.lastFire.result === 'no-fire') {
      return <span className="text-muted">None</span>;
    }

    if (hookStatus.lastFire.result === 'error') {
      return <pre>{JSON.stringify(hookStatus.lastFire.error, null, 2)}</pre>;
    }

    return (
      <span>
        Created task{' '}
        <Link to={`/tasks/${hookStatus.lastFire.taskId}`}>
          {hookStatus.lastFire.taskId}
        </Link>
      </span>
    );
  }

  render() {
    const { hookStatus } = this.props;

    if (!hookStatus) {
      return <Spinner />;
    }

    return (
      <dl className="dl-horizontal">
        <dt>Last Fired</dt>
        <dd>
          {this.renderLastTime()}
          <Button className="btn-xs" onClick={this.props.onRefreshHookStatus}>
            <Glyphicon glyph="refresh" />
          </Button>
        </dd>

        <dt>Last Fire Result</dt>
        <dd>{this.renderLastResult()}</dd>

        <dt>Next Scheduled Fire</dt>
        <dd>
          {hookStatus.nextScheduledDate ? (
            <DateView date={hookStatus.nextScheduledDate} />
          ) : (
            <span className="text-muted">Not Scheduled</span>
          )}
        </dd>
      </dl>
    );
  }
}
