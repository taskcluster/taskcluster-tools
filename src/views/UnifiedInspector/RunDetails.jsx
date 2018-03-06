import { PureComponent } from 'react';
import { object } from 'prop-types';
import { Table, Label } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import DateView from '../../components/DateView';
import { labels } from '../../utils';
import Markdown from '../../components/Markdown';

export default class RunDetails extends PureComponent {
  static propTypes = {
    run: object,
    task: object
  };

  render() {
    const { run, task } = this.props;

    if (!run || !task) {
      return null;
    }

    const { metadata } = task;

    return (
      <Table>
        <tbody>
          <tr>
            <td style={{ borderTop: 'none' }}>Name</td>
            <td style={{ borderTop: 'none' }}>
              <Markdown>{metadata.name}</Markdown>
            </td>
          </tr>

          <tr>
            <td>Description</td>
            <td>
              <Markdown>{metadata.description}</Markdown>
            </td>
          </tr>

          <tr>
            <td>Owner</td>
            <td>
              <code>{metadata.owner}</code>
            </td>
          </tr>

          <tr>
            <td>State</td>
            <td>
              <Label bsStyle={labels[run.state]}>{run.state}</Label>
            </td>
          </tr>

          <tr>
            <td>Reason Created</td>
            <td>
              <code>{run.reasonCreated}</code>
            </td>
          </tr>

          <tr>
            <td>Reason Resolved</td>
            <td>
              {run.reasonResolved ? <code>{run.reasonResolved}</code> : '-'}
            </td>
          </tr>

          <tr>
            <td>Scheduled</td>
            <td>
              <DateView date={run.scheduled} />
            </td>
          </tr>

          <tr>
            <td>Started</td>
            <td>
              {run.started ? (
                <DateView date={run.started} since={run.scheduled} />
              ) : (
                '-'
              )}
            </td>
          </tr>

          <tr>
            <td>Resolved</td>
            <td>
              {run.resolved ? (
                <DateView date={run.resolved} since={run.started} />
              ) : (
                '-'
              )}
            </td>
          </tr>

          <tr>
            <td>WorkerGroup</td>
            <td>{run.workerGroup ? <code>{run.workerGroup}</code> : '-'}</td>
          </tr>

          <tr>
            <td>WorkerId</td>
            <td>
              {run.workerId ? (
                <Link
                  to={`/provisioners/${task.provisionerId}/worker-types/${
                    task.workerType
                  }/workers/${run.workerGroup}/${run.workerId}`}>
                  {run.workerId}
                </Link>
              ) : (
                '-'
              )}
            </td>
          </tr>

          <tr>
            <td>TakenUntil</td>
            <td>{run.takenUntil ? <DateView date={run.takenUntil} /> : '-'}</td>
          </tr>
        </tbody>
      </Table>
    );
  }
}
