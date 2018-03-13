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
  FormControl
} from 'react-bootstrap';
import docsearch from 'docsearch.js/dist/cdn/docsearch';
import 'docsearch.js/dist/cdn/docsearch.css';
import CredentialsMenu from '../CredentialsMenu';
import links from '../../links';
import { navigation, docsSearchContainer } from './styles.module.css';

export default class Navigation extends PureComponent {
  search = null;

  componentDidMount() {
    this.search = docsearch({
      apiKey: process.env.ALGOLIA_API_KEY,
      indexName: process.env.ALGOLIA_INDEX_NAME,
      inputSelector: '#docs-search',
      autocompleteOptions: {
        autoselect: true,
        openOnFocus: true
      }
    });
  }

  render() {
    return (
      <div className={navigation}>
        <Navbar fluid inverse staticTop collapseOnSelect>
          <Navbar.Header>
            <Navbar.Brand>
              <Link to="/">{process.env.APPLICATION_NAME}</Link>
            </Navbar.Brand>
          </Navbar.Header>
          <Nav pullRight>
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
