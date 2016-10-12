import React from 'react';
import { OverlayTrigger, Tooltip, NavItem, Glyphicon } from 'react-bootstrap';
import { buildLoginURL } from '../auth';

export default class extends React.Component {
  static displayName = 'ManualMenuItem';

  signIn() {
    // This uses `auth.buildLoginURL()` to generate a URL to the production login service, so this
    // development instance of tools acts as a third-party to the production instance
    window.open(buildLoginURL(), '_blank');
  }

  render() {
    const tooltip = (
      <Tooltip id="manual-signin">
        Use this option to provide a clientId, accessToken, and certificate manually.
      </Tooltip>
    );

    return (
      <OverlayTrigger placement="left" delay={600} overlay={tooltip}>
        <NavItem onSelect={this.props.showManualModal}>
          <Glyphicon glyph="paste" /> Sign In Manually
        </NavItem>
      </OverlayTrigger>
    );
  }
}
