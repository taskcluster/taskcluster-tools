import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Glyphicon, NavDropdown, NavItem, MenuItem } from 'react-bootstrap';
import Icon from 'react-fontawesome';
import OktaLogin from './OktaLogin';
import DevelopmentLogin from './DevelopmentLogin';
import EmailLogin from './EmailLogin';
import ManualLogin from './ManualLogin';

const canSignInUsing = method => process.env.SIGN_IN_METHODS.includes(method);

class CredentialsMenu extends React.PureComponent {
  renderWithCredentials() {
    const { credentials, credentialsExpiringSoon, open, onSignOut, onToggle, registerChild } = this.props;
    const title = (
      <span>
        <Glyphicon
          glyph={credentialsExpiringSoon ? 'exclamation-sign' : 'user'}
          className={credentialsExpiringSoon ? 'text-warning' : null} /> &nbsp;{credentials.clientId}
      </span>
    );

    return (
      // Due to https://github.com/react-bootstrap/react-bootstrap/issues/1301,
      // handle expanding and collapsing this manually
      <NavDropdown id="sign-in-menu" key="sign-in-menu" title={title} ref={registerChild} open={open} onToggle={onToggle}>
        <LinkContainer to="/credentials">
          <MenuItem>
            <Icon name="key" /> Manage Credentials
          </MenuItem>
        </LinkContainer>
        <NavItem onSelect={onSignOut}>
          <Glyphicon glyph="log-out" /> Sign Out
        </NavItem>
      </NavDropdown>
    );
  }

  renderWithoutCredentials() {
    const { registerChild, open, onToggle, onDevelopment, onManualModal } = this.props;
    const title = (
      <span>
        <Glyphicon glyph="log-in" /> Sign In
      </span>
    );

    return (
      // Due to https://github.com/react-bootstrap/react-bootstrap/issues/1301,
      // handle expanding and collapsing this manually
      <NavDropdown id="sign-in-menu" key="sign-in-menu" title={title} ref={registerChild} open={open} onToggle={onToggle}>
        {canSignInUsing('okta') && <OktaLogin />}
        {canSignInUsing('development') && <DevelopmentLogin onSelect={onDevelopment} />}
        {canSignInUsing('email') && <EmailLogin />}
        {canSignInUsing('manual') && <ManualLogin onSelect={onManualModal} />}
      </NavDropdown>
    );
  }

  render() {
    return this.props.credentials ?
      this.renderWithCredentials() :
      this.renderWithoutCredentials();
  }
}

export default CredentialsMenu;
