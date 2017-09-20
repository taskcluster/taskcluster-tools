import React from 'react';
import { OverlayTrigger, Tooltip, NavItem, Glyphicon } from 'react-bootstrap';

// This authenticates to Okta by opening a new Window where Okta will do its thing,
// then closing that window once creds are acquired.
export default class OktaLoginMenuItem extends React.PureComponent {
  render() {
    const tooltip = (
      <Tooltip id="okta-signin">
        If you have a <strong>Mozilla LDAP Account</strong>, sign in with Okta to maximize your
        permissions. You can use this option even if you are not an employee! If you also have a
        Mozillians account, make sure your LDAP email is included in your Mozillians profile.
      </Tooltip>
    );

    return (
      <OverlayTrigger placement="left" delay={600} overlay={tooltip}>
        <NavItem onSelect={this.onSelect}>
          <Glyphicon glyph="log-in" /> Sign In with Okta
        </NavItem>
      </OverlayTrigger>
    );
  }

  onSelect() {
    window.open('https://login.taskcluster.net/sso/login', '_blank');
  }
}
