import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Link } from 'react-router-dom';
import Icon from 'react-fontawesome';
import { Navbar, Nav, NavDropdown, MenuItem } from 'react-bootstrap';
import CredentialsMenu from '../CredentialsMenu';
import CredentialsPopover from '../CredentialsPopover';
import ManualModal from '../ManualModal';
import links from '../../links';
import { navigation } from './styles.css';
import logoUrl from '../../taskcluster.png';

export default class Navigation extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      credentialsMenuExpanded: false,
      showManualModal: false,
      ...this.getCredentialsMessage(props)
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.getCredentialsMessage(nextProps));
  }

  getCredentialsMessage(props) {
    const { credentialsExpiringSoon } = props;

    if (credentialsExpiringSoon) {
      return {
        title: 'Expiring Soon',
        message: 'Your temporary credentials will expire soon. Sign in again to refresh them.'
      };
    }

    return {
      title: null,
      message: null
    };
  }

  render() {
    const {
      credentials, credentialsExpiringSoon, loginUrl, onSignOut, signInManually
    } = this.props;
    const { title, message, credentialsMenuExpanded, showManualModal } = this.state;

    return (
      <div className={navigation}>
        <Navbar fluid={true} inverse={true} staticTop={true}>
          <Navbar.Header>
            <Navbar.Brand>
              <Link to="/">
                <img src={logoUrl} width="26" height="26" /> TaskCluster Tools
              </Link>
            </Navbar.Brand>
          </Navbar.Header>
          <Nav pullRight={true}>
            <NavDropdown key={1} title="Tools" id="tools">
              {links.map(({ title, link, icon }) => (link.startsWith('/') ?
                (
                  <LinkContainer to={link} key={`navigation-link-${link}`}>
                    <MenuItem>
                      <Icon name={icon} fixedWidth={true} /> {title}
                    </MenuItem>
                  </LinkContainer>
                ) :
                (
                  <MenuItem href={link} key={`navigation-link-${link}`} target="_blank" rel="noopener noreferrer">
                    <Icon name={icon} fixedWidth={true} /> {title}
                  </MenuItem>
                )
              ))}
            </NavDropdown>

            <CredentialsMenu
              open={credentialsMenuExpanded}
              onToggle={expanded => this.setState({ credentialsMenuExpanded: expanded })}
              onDevelopment={() => window.open(loginUrl, '_blank')}
              onManualModal={() => this.setState({ showManualModal: true })}
              onSignOut={onSignOut}
              credentials={credentials}
              credentialsExpiringSoon={credentialsExpiringSoon}
              registerChild={ref => this.credentialsMenu = ref} />
          </Nav>

          {message && (
            <CredentialsPopover
              target={this.credentialsMenu}
              onHide={() => this.setState({ message: null, title: null })}
              message={message}
              title={title} />
          )}
          {showManualModal && (
            <ManualModal
              onClose={() => this.setState({ showManualModal: false })}
              onSubmit={(creds) => {
                signInManually && signInManually(creds);
                this.setState({ credentialsMenuExpanded: false, showManualModal: false });
              }} />
          )}
        </Navbar>
      </div>
    );
  }
}
