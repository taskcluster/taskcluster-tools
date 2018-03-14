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
import docsearch from 'docsearch.js/dist/cdn/docsearch';
import 'docsearch.js/dist/cdn/docsearch.css';
import CredentialsMenu from '../CredentialsMenu';
import links from '../../links';
import docsLinks from '../../docs-links';
import { navigation } from './styles.module.css';

export default class Navigation extends PureComponent {
  render() {
    const commit = (
      <Tooltip id="commit-tooltip">
        View the source of commit {process.env.COMMIT_HASH.substr(0, 12)} on
        GitHub.
      </Tooltip>
    );
    const sourcelink = `https://github.com/taskcluster/taskcluster-tools/tree/${
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
            <NavDropdown key={2} title="Docs" id="docs">
              {docsLinks.map(({ section, links }, index) => [
                <MenuItem header key={`navigation-header-${section}`}>
                  {section}
                </MenuItem>,
                ...links.map(({ title, link }) => (
                  <LinkContainer
                    exact
                    to={link}
                    key={`navigation-docs-link-${link}`}>
                    <MenuItem>{title}</MenuItem>
                  </LinkContainer>
                )),
                ...(index === docsLinks.length - 1
                  ? []
                  : [
                      <MenuItem
                        divider
                        key={`navigation-header-divider-${section}`}
                      />
                    ])
              ])}
            </NavDropdown>
            <OverlayTrigger placement="bottom" overlay={commit}>
              <NavItem
                href={sourcelink}
                target="_blank"
                rel="noopener noreferrer">
                <Icon name="code-fork" size="lg" />
              </NavItem>
            </OverlayTrigger>
            <NavItem className={docsSearchContainer}>
              <FormControl
                type="text"
                id="docs-search"
                placeholder="Search docs..."
                bsSize="sm"
              />
            </NavItem>
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
