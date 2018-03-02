import { PureComponent } from 'react';
import { bool, object, string, number } from 'prop-types';
import { NavItem, NavDropdown, MenuItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { isNil } from 'ramda';

export default class RunsMenu extends PureComponent {
  static propTypes = {
    status: object,
    taskGroupId: string,
    taskId: string,
    active: bool,
    runId: number
  };

  static defaultProps = {
    active: false
  };

  getRunsTitle() {
    const { runId, status } = this.props;

    return runId === status.runs.length - 1
      ? `Task Run ${runId} (Latest)`
      : `Task Run ${runId}`;
  }

  render() {
    const { status, taskGroupId, taskId, active, runId } = this.props;

    if (
      !status ||
      !status.runs ||
      !status.runs.length ||
      !taskId ||
      !taskGroupId ||
      isNil(runId)
    ) {
      return <NavItem disabled>No runs for task</NavItem>;
    }

    if (status.runs.length === 1) {
      return (
        <LinkContainer
          to={`/groups/${taskGroupId}/tasks/${taskId}/runs/0`}
          exact>
          <NavItem>Task Run 0 (Latest)</NavItem>
        </LinkContainer>
      );
    }

    return (
      <NavDropdown
        title={this.getRunsTitle()}
        active={active}
        id="runs-dropdown">
        {Array.from(status.runs)
          .reverse()
          .map(({ runId }, index) => (
            <LinkContainer
              to={`/groups/${taskGroupId}/tasks/${taskId}/runs/${runId}`}
              key={`runs-menu-item-${index}`}>
              <MenuItem>
                Task Run {runId}
                {index === 0 ? ' (Latest)' : ''}
              </MenuItem>
            </LinkContainer>
          ))}
      </NavDropdown>
    );
  }
}
