import React from 'react';
import { OverlayTrigger, Tooltip, NavItem, Glyphicon } from 'react-bootstrap';

export default class DevelopmentLogin extends React.PureComponent {
  render() {
    const tooltip = (
      <Tooltip id="development-signin">
        When running tools on a development server, use this option to get credentials from the production tools.
      </Tooltip>
    );


    return (
      <OverlayTrigger placement="left" delay={600} overlay={tooltip}>
        <NavItem onSelect={this.props.onSelect}>
          <Glyphicon glyph="console" /> Development Sign-In
        </NavItem>
      </OverlayTrigger>
    );
  }
}
