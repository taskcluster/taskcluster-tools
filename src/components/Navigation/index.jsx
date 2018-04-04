import { PureComponent } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Link } from 'react-router-dom';
import Icon from 'react-fontawesome';
import {
  Navbar,
  Nav,
  NavDropdown,
  MenuItem,
  NavItem,
  Tooltip,
  OverlayTrigger
} from 'react-bootstrap';
import CredentialsMenu from '../CredentialsMenu';
import links from '../../links';
import { navigation } from './styles.module.css';
import logoUrl from '../../taskcluster.png';

export default class Navigation extends PureComponent {
  render() {
    const commit = (
      <Tooltip id="commit-tooltip">
        View the source of commit {process.env.COMMITHASH} on GitHub.
      </Tooltip>
    );
    const sourcelink = `https://github.com/taskcluster/taskcluster-tools/tree/
${process.env.COMMITHASH}`;

    return (
      <div className={navigation}>
        <Navbar fluid inverse staticTop collapseOnSelect>
          <Navbar.Header>
            <Navbar.Brand>
              <Link to="/">
                <img src={logoUrl} width="26" height="26" /> Taskcluster Tools
              </Link>
            </Navbar.Brand>
          </Navbar.Header>
          <Nav pullRight>
            <OverlayTrigger placement="bottom" overlay={commit}>
              <NavItem
                href={sourcelink}
                target="_blank"
                rel="noopener noreferrer">
                <Icon className="fa-code-fork" name="fork" />
              </NavItem>
            </OverlayTrigger>
            <NavDropdown key={1} title="Tools" id="tools">
              {links.map(
                ({ title, link, icon }) =>
                  link.startsWith('/') ? (
                    <LinkContainer to={link} key={`navigation-link-${link}`}>
                      <MenuItem>
                        <Icon name={icon} fixedWidth /> {title}
                      </MenuItem>
                    </LinkContainer>
                  ) : (
                    <MenuItem
                      href={link}
                      key={`navigation-link-${link}`}
                      target="_blank"
                      rel="noopener noreferrer">
                      <Icon name={icon} fixedWidth /> {title}
                    </MenuItem>
                  )
              )}
            </NavDropdown>
            <CredentialsMenu />
          </Nav>
        </Navbar>
      </div>
    );
  }
}
