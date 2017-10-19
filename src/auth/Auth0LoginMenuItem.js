import React from 'react';
import { OverlayTrigger, Tooltip, NavItem, Glyphicon } from 'react-bootstrap';

// This authenticates to Auth0 by opening a new Window where Auth0 will do its
// thing, then closing that window when login is complete.
export default class Auth0LoginMenuItem extends React.PureComponent {
  render() {
    const tooltip = (
      <Tooltip id="auth0-signin">
        Sign in with the LDAP account you use to push to version control, or
        with email if you do not have version control access.
      </Tooltip>
    );

    return (
      <OverlayTrigger placement="left" delay={600} overlay={tooltip}>
        <NavItem onSelect={this.onSelect}>
          <Glyphicon glyph="log-in" /> Sign In with Auth0
        </NavItem>
      </OverlayTrigger>
    );
  }

  onSelect() {
    // open the login view in a new tab/window
    const loginView = new URL('/login/auth0', window.location);

    window.open(loginView, '_blank');
  }
}
