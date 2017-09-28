import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Link } from 'react-router-dom';
import Icon from 'react-fontawesome';
import { Navbar, Nav, NavDropdown, MenuItem } from 'react-bootstrap';
import CredentialsMenu from '../CredentialsMenu';
import links from '../../links';
import { navigation } from './styles.css';
import logoUrl from '../../taskcluster.png';

export default class Navigation extends React.PureComponent {
  render() {
    const { userSession, authController } = this.props;

    return (
      <div className={navigation}>
        <Navbar
          fluid={true}
          inverse={true}
          staticTop={true}
          collapseOnSelect={true}>
          <Navbar.Header>
            <Navbar.Brand>
              <Link to="/">
                <img src={logoUrl} width="26" height="26" /> Taskcluster Tools
              </Link>
            </Navbar.Brand>
          </Navbar.Header>
          <Nav pullRight={true}>
            <NavDropdown key={1} title="Tools" id="tools">
              {links.map(
                ({ title, link, icon }) =>
                  link.startsWith('/') ? (
                    <LinkContainer to={link} key={`navigation-link-${link}`}>
                      <MenuItem>
                        <Icon name={icon} fixedWidth={true} /> {title}
                      </MenuItem>
                    </LinkContainer>
                  ) : (
                    <MenuItem
                      href={link}
                      key={`navigation-link-${link}`}
                      target="_blank"
                      rel="noopener noreferrer">
                      <Icon name={icon} fixedWidth={true} /> {title}
                    </MenuItem>
                  )
              )}
            </NavDropdown>

            <CredentialsMenu
              userSession={userSession}
              authController={authController}
            />
          </Nav>
        </Navbar>
      </div>
    );
  }
}
