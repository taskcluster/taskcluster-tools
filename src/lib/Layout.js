import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  Navbar, Nav, NavItem, NavDropdown, MenuItem,
  Glyphicon, Popover, Overlay
} from 'react-bootstrap';
import menu from '../menu';
import * as auth from './auth';
import { Icon } from './format';
import './base-layout.less';

// time before expiration at which we warn
const EXPIRY_WARNING = 5 * 60 * 1000;

/** Navigation bar for layout.jade */
const Navigation = React.createClass({
  getInitialState() {
    return {
      credentials: auth.loadCredentials(),
      credentialsExpiringSoon: false,
      credentialsMessage: null
    };
  },

  // Log-in open an authentication URL
  signIn() {
    window.open(auth.buildLoginURL(), '_blank');
  },

  // Log out (clear credentials)
  signOut() {
    // Clear credentials
    auth.saveCredentials(null);
    // Update state
    this.setState({ credentials: null });
  },

  // Listen for credentials-changed events
  componentDidMount() {
    window.addEventListener('credentials-changed', this.handleCredentialsChanged, false);
    this.startExpirationTimer();
  },

  // Stop listening for credentials-changed events
  componentWillUnmount() {
    window.removeEventListener('credentials-changed', this.handleCredentialsChanged, false);
    this.stopExpirationTimer();
  },

  // Credentials changed
  handleCredentialsChanged() {
    const credentials = auth.loadCredentials();

    // Reload credentials
    this.setState({
      credentials,
      credentialsExpiringSoon: false,
      credentialsMessage: credentials ? {
        title: 'Signed In',
        body: `You are now signed in as ${credentials.clientId}.`
      } : {
        title: 'Signed Out',
        body: 'You are now signed out.'
      }
    });

    this.startExpirationTimer();
  },

  startExpirationTimer() {
    this.stopExpirationTimer();

    // we only support monitoring expiration of temporary credentials (anything
    // else requires hitting the auth API, and temporary credentials are the
    // common case)
    const credentials = auth.loadCredentials();

    if (!credentials || !credentials.certificate || !credentials.certificate.expiry) {
      return;
    }

    const expiry = credentials.certificate.expiry;

    if (expiry < (Date.now() + EXPIRY_WARNING)) {
      this.showExpirationWarning();
      return;
    }

    const timeout = expiry - Date.now() - EXPIRY_WARNING + 500;

    this.expirationTimer = setTimeout(() => this.showExpirationWarning(), timeout);
  },

  stopExpirationTimer() {
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }
  },

  showExpirationWarning() {
    this.setState({
      credentialsExpiringSoon: true,
      credentialsMessage: {
        title: 'Expiring Soon',
        body: 'Your temporary credentials will expire soon.  Sign in again to refresh them.'
      }
    });
  },

  // Render navigation bar
  render() {
    // Find active menu entry
    let activeEntry = menu.find(entry => entry.link === location.pathname) ||
      { title: 'Unknown Page' };

    // Remove title on landing page
    if (window.location.pathname === '/') {
      activeEntry = null;
    } else {
      const link = document.createElement('link');
      const icons = Array.from(document.querySelectorAll('link[rel*=icon]'));

      link.setAttribute('rel', 'shortcut icon');
      link.setAttribute('type', 'image/png');
      link.setAttribute('href',
        `/lib/assets/font-awesome-favicons/black/png/16/${activeEntry.icon}.png`);

      icons.forEach(icon => icon.parentNode.removeChild(icon));
      document.getElementsByTagName('head')[0].appendChild(link);
      document.title = activeEntry.title;
    }

    // Construct the navbar
    return (
      <Navbar fluid={true} inverse={true} staticTop={true}>
        <Navbar.Header>
          <Navbar.Brand>
            <a href="/">
              <img src="/lib/assets/taskcluster-36.png" width="26" height="26" /> TaskCluster Tools
            </a>
          </Navbar.Brand>
        </Navbar.Header>
        <Navbar.Text>
          {
            activeEntry ? (
              <span>
                <Icon name={activeEntry.icon || 'wrench'} fixedWidth />
                &nbsp;&nbsp;
                {activeEntry.title}
              </span>
            ) : null
          }
        </Navbar.Text>
        <Nav pullRight={true}>
          <NavDropdown key={1} title="Tools" id="tools">
            {menu
              .filter(entry => entry.display)
              .map((entry, index) => {
                if (entry.type === 'divider') {
                  return <MenuItem key={index} divider />;
                }

                return (
                  <MenuItem key={index} href={entry.link}>
                    <Icon name={entry.icon || 'wrench'} fixedWidth />&nbsp;&nbsp;{entry.title}
                  </MenuItem>
                );
              })
            }
          </NavDropdown>
          {this.renderCredentialsMenu()}
        </Nav>
        {this.renderCredentialsPopover()}
      </Navbar>
    );
  },

  renderCredentialsMenu() {
    // if there are no credentials at all, then there is no menu -- just a sign-in link
    if (!this.state.credentials) {
      return (
        <NavItem onSelect={this.signIn} ref="credentials">
          <Glyphicon glyph="log-in" /> Sign in
        </NavItem>
      );
    }

    // TODO: color this according to time until expiry
    const glyph = this.state.credentialsExpiringSoon ? 'exclamation-sign' : 'user';
    const className = this.state.credentialsExpiringSoon ? 'text-warning' : '';
    const menuHeading = (
      <span>
        <Glyphicon className={className} glyph={glyph}/> {this.state.credentials.clientId}
      </span>
    );

    return (
      <NavDropdown key={2} title={menuHeading} ref="credentials" id="credentials">
        <MenuItem href="/credentials">
          <Icon name="key"/> Manage Credentials
        </MenuItem>
        <MenuItem divider />
        <NavItem onSelect={this.signIn}>
          <Glyphicon glyph="log-in"/> Sign In
        </NavItem>
        <NavItem onSelect={this.signOut}>
          <Glyphicon glyph="log-out"/> Sign Out
        </NavItem>
      </NavDropdown>
    );
  },

  renderCredentialsPopover() {
    if (!this.state.credentialsMessage) {
      return null;
    }

    const popover = (
      <Popover placement="bottom" id="signin-alert" title={this.state.credentialsMessage.title}>
        {this.state.credentialsMessage.body}
      </Popover>
    );

    return (
      <Overlay
        show={true}
        rootClose={true}
        onHide={this.overlayHideHandler}
        placement="bottom"
        target={() => findDOMNode(this.refs.credentials)}>
        {popover}
      </Overlay>
    );
  },

  overlayHideHandler() {
    this.setState({ credentialsMessage: '' });
  }
});

const Layout = props => (
  <div>
    <div id="navbar">
      <Navigation />
    </div>
    <div id="container" className="container-fluid">{props.children}</div>
  </div>
);

export default Layout;
