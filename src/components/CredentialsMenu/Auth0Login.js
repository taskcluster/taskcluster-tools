import React from 'react';
import { NavItem, Glyphicon } from 'react-bootstrap';

// This authenticates to Auth0 by opening a new Window where Auth0 will do its
// thing, then closing that window when login is complete.

export default class Auth0Login extends React.PureComponent {
  onSelect() {
    // open the login view in a new tab/window
    const loginView = new URL('/login/auth0', window.location);
    window.open(loginView, '_blank');
  }

  render() {
    return (
      <NavItem onSelect={this.onSelect}>
        <Glyphicon glyph="log-in" /> Sign In with Auth0
      </NavItem>
    );
  }
}
