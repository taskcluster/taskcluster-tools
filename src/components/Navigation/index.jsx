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

export default class Navigation extends PureComponent {
  render() {
    const commit = (
      <Tooltip id="commit-tooltip">
        View the source of commit {process.env.COMMIT_HASH.substr(0, 12)} on
        GitHub.
      </Tooltip>
    );
    const sourceLink = `https://github.com/taskcluster/taskcluster-tools/tree/${
      process.env.COMMIT_HASH
    }`;

    return (
      <div className={navigation}>
        <Navbar fluid inverse staticTop collapseOnSelect>
          <Navbar.Header>
            <Navbar.Brand>
              <Link to="/">{process.env.APPLICATION_NAME}</Link>
            </Navbar.Brand>
          </Navbar.Header>
          <Nav pullRight>
            <OverlayTrigger placement="bottom" overlay={commit}>
              <NavItem
                href={sourceLink}
                target="_blank"
                rel="noopener noreferrer">
                <Icon name="code-fork" size="lg" />
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
