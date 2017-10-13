import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import {
  Glyphicon,
  NavDropdown,
  NavItem,
  MenuItem,
  Nav
} from 'react-bootstrap';
import Icon from 'react-fontawesome';
import { loadable } from '../../utils';

const Auth0LoginMenuItem = loadable(() =>
  import(/* webpackChunkName: 'Auth0LoginMenuItem' */ '../../auth/Auth0LoginMenuItem')
);
const DevelopmentLoginMenuItem = loadable(() =>
  import(/* webpackChunkName: 'DevelopmentLoginMenuItem' */ '../../auth/DevelopmentLoginMenuItem')
);
const ManualLoginMenuItem = loadable(() =>
  import(/* webpackChunkName: 'ManualLoginMenuItem' */ '../../auth/ManualLoginMenuItem')
);

class CredentialsMenu extends React.PureComponent {
  renderWithUser() {
    const { userSession, authController } = this.props;
    const icon = userSession.picture ? (
      <img
        src={userSession.picture}
        style={{ width: 18, height: 18, borderRadius: 9 }}
      />
    ) : (
      <Glyphicon glyph="user" />
    );
    const title = (
      <span>
        {icon}&nbsp;{userSession.name}
      </span>
    );

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
      <NavDropdown
        id="sign-in-menu"
        key="sign-in-menu"
        title={title}
        ref={registerChild}>
        {authController.canSignInUsing('auth0') && (
          <Auth0LoginMenuItem key="auth0" />
        )}
        {authController.canSignInUsing('development') && (
          <DevelopmentLoginMenuItem key="development" />
        )}
        {authController.canSignInUsing('manual') && (
          <ManualLoginMenuItem key="manual" />
        )}
      </NavDropdown>
    );
  }

  renderAsList = () => {
    if (this.props.userSession) {
      return;
    }

    return (
      <Nav bsStyle="pills" stacked>
        {this.props.authController.canSignInUsing('auth0') && (
          <Auth0LoginMenuItem key="auth0" />
        )}
        {this.props.authController.canSignInUsing('development') && (
          <DevelopmentLoginMenuItem key="development" />
        )}
        {this.props.authController.canSignInUsing('manual') && (
          <ManualLoginMenuItem key="manual" />
        )}
      </Nav>
    );
  };

  render() {
    if (this.props.inline) {
      return this.renderAsList();
    }

    return this.props.userSession
      ? this.renderWithUser()
      : this.renderWithoutUser();
  }
}

export default CredentialsMenu;
