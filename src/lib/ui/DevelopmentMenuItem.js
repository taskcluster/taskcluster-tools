import React from 'react';
import { OverlayTrigger, Tooltip, NavItem, Glyphicon } from 'react-bootstrap';
import { buildLoginURL } from '../auth';

export default class extends React.Component {
  static displayName = 'DevelopmentMenuItem';

  signIn() {
    // This uses `auth.buildLoginURL()` to generate a URL to the production login service, so this
    // development instance of tools acts as a third-party to the production instance
    window.open(buildLoginURL(), '_blank');
  }

  render() {
    const tooltip = (
      <Tooltip id="development-signin">
        When running tools on a development server, use this option to get credentials from the
        production tools.
      </Tooltip>
    );

    return (
      <OverlayTrigger placement="left" delay={600} overlay={tooltip}>
        <NavItem onSelect={this.signIn}>
          <Glyphicon glyph="console" /> Development Sign-In
        </NavItem>
      </OverlayTrigger>
    );
  }
}
