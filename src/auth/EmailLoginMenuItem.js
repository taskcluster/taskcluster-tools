import React, { Component } from 'react';
import { OverlayTrigger, Tooltip, NavItem, Glyphicon } from 'react-bootstrap';

// This authenticates with Auth0's passwordless lock by opening a new Window
// where Auth0 will do its thing, then closing that window once creds are
// acquired.
export default class EmailLoginMenuItem extends Component {
  render() {
    const tooltip = (
      <Tooltip id="passwordless-signin">
        If you are a Mozillian but do not have an LDAP account, sign in with
        this option, which will require you to verify your email address, using
        an email on your Mozillians profile.  If you do not have a Mozillians
        profile, set one up now. Get vouched to gain access to additional
        scopes.
      </Tooltip>
    );

    return (
      <OverlayTrigger placement="left" delay={600} overlay={tooltip}>
        <NavItem onSelect={this.props.onSelect}>
          <Glyphicon glyph="log-in" /> Sign In with Email
        </NavItem>
      </OverlayTrigger>
    );
  }

  onSelect() {
    // Just loading this login.t.n page is sufficient. It eventually redirects back to
    // https://tools.t.n/login, which updates LocalStorage. Auth listens for
    // such updates and loads the creds out of storage.
    window.open('https://login.taskcluster.net/auth0/login', '_blank');
  }
}
