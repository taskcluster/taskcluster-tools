import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Glyphicon, NavDropdown, NavItem, MenuItem } from 'react-bootstrap';
import Icon from 'react-fontawesome';

class CredentialsMenu extends React.PureComponent {
  renderWithUser() {
    const { userSession, authController } = this.props;
    const icon = userSession.picture ?
      <img src={userSession.picture} style={{ width: 18, height: 18, borderRadius: 9 }} /> :
      <Glyphicon glyph="user" />;
    const title = <span>{icon}&nbsp;{userSession.name}</span>;

    return (
      <NavDropdown id="sign-in-menu" key="sign-in-menu" title={title}>
        <LinkContainer to="/credentials">
          <MenuItem>
            <Icon name="key" /> Manage Credentials
          </MenuItem>
        </LinkContainer>
        <NavItem onSelect={() => authController.setUserSession(null)}>
          <Glyphicon glyph="log-out" /> Sign Out
        </NavItem>
      </NavDropdown>
    );
  }

  renderWithoutUser() {
    const { registerChild, authController } = this.props;
    const title = (
      <span>
        <Glyphicon glyph="log-in" /> Sign In
      </span>
    );

    return (
      <NavDropdown id="sign-in-menu" key="sign-in-menu" title={title} ref={registerChild}>
        {authController.credentialsMenuItems()}
      </NavDropdown>
    );
  }

  render() {
    return this.props.userSession ?
      this.renderWithUser() :
      this.renderWithoutUser();
  }
}

export default CredentialsMenu;
