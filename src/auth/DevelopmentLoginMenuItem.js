import React from 'react';
import { OverlayTrigger, Tooltip, NavItem, Glyphicon } from 'react-bootstrap';

export default class DevelopmentLoginMenuItem extends React.PureComponent {
  render() {
    const tooltip = (
      <Tooltip id="development-signin">
        When running tools on a development server, use this option to get
        credentials from the production tools.
      </Tooltip>
    );

    return (
      <OverlayTrigger placement="left" delay={600} overlay={tooltip}>
        <NavItem onSelect={this.onSelect}>
          <Glyphicon glyph="console" /> Development Sign-In
        </NavItem>
      </OverlayTrigger>
    );
  }

  onSelect() {
    const query = new URLSearchParams();

    query.set('target', new URL('/login/development', window.location));
    query.set(
      'description',
      'Taskcluster Tools offers various way to create and inspect both tasks and task groups.'
    );
    window.open(`https://login.taskcluster.net/?${query.toString()}`, '_blank');
  }
}
