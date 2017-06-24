import React from 'react';
import { array, bool, number, string } from 'prop-types';
import { NavDropdown, MenuItem, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { isNil } from 'ramda';

export default class LogsMenu extends React.PureComponent {
  static propTypes = {
    taskGroupId: string,
    taskId: string,
    logs: array,
    runId: number,
    active: bool
  };

  render() {
    const { taskGroupId, taskId, runId, logs, active } = this.props;

    if (!taskGroupId || !taskId || isNil(runId) || !logs || !logs.length) {
      return <NavItem disabled>No logs</NavItem>;
    }
    //subSectionId === 'logs'
    return (
      <NavDropdown title="Logs" active={active} id="logs-dropdown">
        {logs.map((log, index) => (
          <LinkContainer
            to={`/groups/${taskGroupId}/tasks/${taskId}/runs/${runId}/logs/${encodeURIComponent(log.name)}`}
            key={`runs-menu-logs-${index}`}>
            <MenuItem>
              <span style={log.name === 'public/logs/live_backing.log' ? { color: '#999' } : null}>
                {log.name}
              </span>
            </MenuItem>
          </LinkContainer>
        ))}
      </NavDropdown>
    );
  }
}
