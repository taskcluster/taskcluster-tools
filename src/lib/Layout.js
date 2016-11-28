import React from 'react';
import {findDOMNode} from 'react-dom';
import {
  Navbar, Nav, NavItem, NavDropdown, MenuItem, Glyphicon, Popover, Overlay, Modal, Button, FormControl, FormGroup,
  ControlLabel,
} from 'react-bootstrap';
import menu from '../menu';
import * as auth from './auth';
import {Icon} from './format';
import OktaMenuItem from './ui/OktaMenuItem';
import DevelopmentMenuItem from './ui/DevelopmentMenuItem';
import EmailMenuItem from './ui/EmailMenuItem';
import ManualMenuItem from './ui/ManualMenuItem';
import './base-layout.less';

// time before expiration at which we warn
const EXPIRY_WARNING = 5 * 60 * 1000;
const SIGNIN_MENU_ITEMS = {
  okta: OktaMenuItem,
  development: DevelopmentMenuItem,
  email: EmailMenuItem,
  manual: ManualMenuItem,
};

/** Navigation bar for layout.jade */
const Navigation = React.createClass({
  getInitialState() {
    return {
      credentials: auth.loadCredentials(),
      credentialsExpiringSoon: false,
      credentialsMessage: null,
      signinMenuOpen: false,
      showManualModal: false,
      manualClientId: '',
      manualAccessToken: '',
      manualCertificate: '',
    };
  },

  // Log out (clear credentials)
  signOut() {
    // Clear credentials
    auth.saveCredentials(null);
    // Update state
    this.setState({credentials: null});
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
      signinMenuOpen: false,
      showManualModal: false,
      credentialsMessage: credentials ? {
        title: 'Signed In',
        body: `You are now signed in as ${credentials.clientId}.`,
      } : {
        title: 'Signed Out',
        body: 'You are now signed out.',
      },
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

    const timeout = (expiry - Date.now()) - (EXPIRY_WARNING + 500);

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
        body: 'Your temporary credentials will expire soon.  Sign in again to refresh them.',
      },
    });
  },

  // Render navigation bar
  render() {
    // Find active menu entry
    let activeEntry = menu.find(entry => entry.link === location.pathname) ||
      {title: 'Unknown Page'};

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
                <Icon name={activeEntry.icon || 'wrench'} fixedWidth={true} />
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
                  return <MenuItem key={index} divider={true} />;
                }

                return (
                  <MenuItem key={index} href={entry.link}>
                    <Icon name={entry.icon || 'wrench'} fixedWidth={true} />&nbsp;&nbsp;{entry.title}
                  </MenuItem>
                );
              })
            }
          </NavDropdown>
          {this.renderCredentialsMenu()}
        </Nav>
        {this.renderCredentialsPopover()}
        {this.renderManualModal()}
      </Navbar>
    );
  },

  setCredentials(credentials) {
    this.setState({signinMenuOpen: false});
    auth.saveCredentials(credentials);
  },

  showMessage({title, body}) {
    this.setState({
      credentialsMessage: {title, body},
      signinMenuOpen: false,
    });
  },

  showManualModal() {
    this.setState({showManualModal: true});
  },

  renderCredentialsMenu() {
    if (this.state.credentials) {
      const glyph = this.state.credentialsExpiringSoon ? 'exclamation-sign' : 'user';
      const className = this.state.credentialsExpiringSoon ? 'text-warning' : '';
      const menuHeading = (
        <span>
          <Glyphicon className={className} glyph={glyph} /> {this.state.credentials.clientId}
        </span>
      );

      return (
        <NavDropdown
          title={menuHeading}
          ref="credentials"
          id="credentials"
          open={this.state.signinMenuOpen}
          // Due to https://github.com/react-bootstrap/react-bootstrap/issues/1301,
          // handle expanding and collapsing this manually
          onToggle={expanded => this.setState({signinMenuOpen: expanded})}>
          <MenuItem href="/credentials/">
            <Icon name="key" /> Manage Credentials
          </MenuItem>
          <NavItem onSelect={this.signOut}>
            <Glyphicon glyph="log-out" /> Sign Out
          </NavItem>
        </NavDropdown>
      );
    }

    const menuHeading = <span><Glyphicon glyph="log-in" /> Sign In</span>;

    return (
      <NavDropdown
        title={menuHeading}
        ref="credentials"
        id="credentials"
        open={this.state.signinMenuOpen}
        // Due to https://github.com/react-bootstrap/react-bootstrap/issues/1301,
        // handle expanding and collapsing this manually
        onToggle={expanded => this.setState({signinMenuOpen: expanded})}>
        {
          Object
            .keys(SIGNIN_MENU_ITEMS)
            .map(key => {
              const MenuItem = SIGNIN_MENU_ITEMS[key];

              if (!process.env.SIGN_IN_METHODS.includes(key)) {
                return null;
              }

              return (
                <MenuItem
                  key={key}
                  setCredentials={this.setCredentials}
                  showMessage={this.showMessage}
                  showManualModal={this.showManualModal} />
              );
            })
        }
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

  closeModal() {
    this.setState({showManualModal: false});
  },

  submitForm(e) {
    e.preventDefault();

    let certificate;

    if (this.state.manualCertificate !== '') {
      try {
        certificate = JSON.parse(this.state.manualCertificate);
      } catch (err) {
        return;
      }
    }

    auth.saveCredentials({
      certificate,
      clientId: this.state.manualClientId,
      accessToken: this.state.manualAccessToken,
    });
    this.setState({signinMenuOpen: false, showManualModal: false});
  },

  certificateIsValid() {
    const {manualCertificate} = this.state;

    if (manualCertificate === '') {
      return true;
    }

    try {
      JSON.parse(manualCertificate);
      return true;
    } catch (err) {
      return false;
    }
  },

  formIsValid() {
    return this.state.manualClientId && this.state.manualAccessToken && this.certificateIsValid();
  },

  renderManualModal() {
    // This modal must be outside of the "Sign In Manually" menu option as that
    // menu option is removed from the DOM as soon as it loses focus.
    if (!this.state.showManualModal) {
      return;
    }

    return (
      <Modal show={true}>
        <form className="login-form" onSubmit={this.submitForm}>
          <Modal.Header><h4>Manual Sign-In</h4></Modal.Header>
          <Modal.Body>
            <FormGroup controlId="clientId">
              <ControlLabel>Client Id</ControlLabel>
              <FormControl
                required={true}
                className="top-element"
                ref="clientId"
                name="clientId"
                type="text"
                placeholder="clientId"
                onChange={e => this.setState({manualClientId: e.target.value})} />
            </FormGroup>
            <FormGroup controlId="accessToken">
              <ControlLabel>Access Token</ControlLabel>
              <FormControl
                required={true}
                className="mid-element"
                ref="accessToken"
                name="accessToken"
                type="password"
                placeholder="accessToken"
                onChange={e => this.setState({manualAccessToken: e.target.value})} />
            </FormGroup>
            <FormGroup controlId="certificate">
              <ControlLabel>Certificate</ControlLabel>
              <FormControl
                componentClass="textarea"
                className="bottom-element"
                ref="certificate"
                name="certificate"
                rows={8}
                placeholder="JSON certificate (if required)"
                onChange={e => this.setState({manualCertificate: e.target.value})} />
            </FormGroup>
            <p className="text-muted">Note that the credentials are not checked for validity.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button bsStyle="default" onClick={this.closeModal}>Cancel</Button>
            <Button type="submit" bsStyle="primary" disabled={!this.formIsValid()}>
              <Glyphicon glyph="paste" /> Sign In
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  },

  overlayHideHandler() {
    this.setState({credentialsMessage: ''});
  },
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
