import React from 'react';
import { bool, object, string, number } from 'prop-types';
import { NavItem, NavDropdown, MenuItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { isNil } from 'ramda';

export default class RunsMenu extends React.PureComponent {
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
    const { runId } = this.props;

    return runId === status.runs.length - 1 ?
      `Run ${runId} (Latest)` :
      `Run ${runId}`;
  }

  render() {
    const { status, taskGroupId, taskId, active, runId } = this.props;

    if (!status || !taskId || !taskGroupId || isNil(runId)) {
      return <NavItem disabled>No runs</NavItem>;
    }

    if (status.runs.length === 1) {
      return (
        <LinkContainer to={`/groups/${taskGroupId}/tasks/${taskId}/runs/0`} exact={true}>
          <NavItem>Run 0 (Latest)</NavItem>
        </LinkContainer>
      );
    }

    return (
      <NavDropdown title={this.getRunsTitle()} active={active} id="runs-dropdown">
        {[...status.runs].reverse().map(({ runId }, index) => (
          <LinkContainer to={`/groups/${taskGroupId}/tasks/${taskId}/runs/${runId}`} key={`runs-menu-item-${index}`}>
            <MenuItem>Run {runId}{index === 0 ? ' (Latest)' : ''}</MenuItem>
          </LinkContainer>
        ))}
      </NavDropdown>
    );
  }
}
