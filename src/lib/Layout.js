import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  Navbar, Nav, NavItem, NavDropdown, MenuItem,
  Glyphicon, Popover, Overlay, OverlayTrigger,
  Tooltip, Modal, Button, FormControl, FormGroup,
  ControlLabel
} from 'react-bootstrap';
import menu from '../menu';
import * as auth from './auth';
import { Icon } from './format';
import './base-layout.less';
import taskcluster from 'taskcluster-client';

// time before expiration at which we warn
const EXPIRY_WARNING = 5 * 60 * 1000;

const OktaMenuItem = React.createClass({
  // This authenticates to Okta by opening a new Window where Okta will do its thing,
  // then closing that window once creds are acquired.
  signIn() {
    // Just loading this page is sufficient.  It eventually redirects back to
    // https://tools.t.n/login, which updates LocalStorage.  Auth listens for
    // such updates and loads the creds out of storage.
    window.open('https://login.taskcluster.net/sso/login', '_blank');
  },

  render() {
    return (
      <OverlayTrigger placement="left" delay={600} overlay={
        <Tooltip id="okta-signin">If you have a <b>Mozilla LDAP Account</b>, sign
          in with Okta to maximize your permissions. You can use this option even
          if you are not an employee! If you also have a Mozillians account, make
          sure your LDAP email is included in your Mozillians
          profile.</Tooltip>
        }>
        <NavItem onSelect={this.signIn}>
          <Glyphicon glyph="log-in"/> Sign In with Okta
        </NavItem>
      </OverlayTrigger>
    );
  }
});

const PersonaMenuItem = React.createClass({
  // This interfaces directly with Persona, then uses the Login service API to
  // convert the resulting promise into TaskCluster credentials.  NOTE: when
  // Persona is gone, also remove the include.js reference in template.ejs
  propTypes: {
    setCredentials: React.PropTypes.func.isRequired,
    showMessage: React.PropTypes.func.isRequired
  },

  signIn() {
    navigator.id.get(assertion => {
      const port = location.port || location.protocol === 'https:' ? '443' : '80';
      const audience = `${location.protocol}//${location.host}:${port}`;
      if (assertion) {
        const login = new taskcluster.Login();
        login.credentialsFromPersonaAssertion({ assertion, audience })
          .then(this.props.setCredentials)
          .catch(err => {
            this.propx.showMessage({
              title: 'Sign-In Error',
              body: err.details ? `${err.body.details.code}: ${err.body.details.message}` : err.code
            });
          });
      } else {
        this.propx.showMessage({
          title: 'Sign-In Cancelled',
          body: 'Sign-In was cancelled'
        });
      }
    });
  },

  render() {
    return (
      <OverlayTrigger placement="left" delay={600} overlay={
        <Tooltip id="persona-signin">If you are a Mozillian, but do not have an LDAP
          account, sign in with Persona. If you do not have a Mozillians profile,
          set one up now. Get vouched to gain access to additional
          scopes.</Tooltip>
        }>
        <NavItem onSelect={this.signIn}>
          <Glyphicon glyph="user"/> Sign In with Persona
        </NavItem>
      </OverlayTrigger>
    );
  }
});

const DevelMenuItem = React.createClass({
  // this uses `auth.buildLoginURL()` to generate a URL to the production
  // login service, so this development instance of tools acts as a third-
  // party to the produciton instance
  signIn() {
    window.open(auth.buildLoginURL(), '_blank');
  },

  render() {
    return (
      <OverlayTrigger placement="left" delay={600} overlay={
        <Tooltip id="devel-signin">When running tools on a devel server, use this
          option to get credentials from the production tools</Tooltip>
        }>
        <NavItem onSelect={this.signIn}>
          <Glyphicon glyph="console"/> Development Sign-In
        </NavItem>
      </OverlayTrigger>
    );
  }
});

const ManualMenuItem = React.createClass({
  propTypes: {
    showManualModal: React.PropTypes.func.isRequired
  },

  render() {
    return <OverlayTrigger placement="left" delay={600} overlay={
      <Tooltip id="manual-signin">Use this option to provide a clientId,
        accessToken, and certificate manually.</Tooltip>
      }>
      <NavItem onSelect={this.props.showManualModal}>
        <Glyphicon glyph="paste"/> Sign In Manually
      </NavItem>
    </OverlayTrigger>;
  }
});

const SIGNIN_MENU_ITEMS = {
  okta: React.createFactory(OktaMenuItem),
  persona: React.createFactory(PersonaMenuItem),
  devel: React.createFactory(DevelMenuItem),
  manual: React.createFactory(ManualMenuItem)
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
      manualCertificate: ''
    };
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
      signinMenuOpen: false,
      showManualModal: false,
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
        {this.renderManualModal()}
      </Navbar>
    );
  },

  renderCredentialsMenu() {
    let menuHeading;
    let disabledIfNotSignedIn;
    if (this.state.credentials) {
      const glyph = this.state.credentialsExpiringSoon ? 'exclamation-sign' : 'user';
      const className = this.state.credentialsExpiringSoon ? 'text-warning' : '';
      menuHeading = (
        <span>
          <Glyphicon className={className} glyph={glyph}/> {this.state.credentials.clientId}
        </span>
      );
    } else {
      menuHeading = (
        <span>
          <Glyphicon glyph="log-in"/> Sign In
        </span>
      );
      disabledIfNotSignedIn = 'disabled';
    }

    // TODO: get this from config
    const signinMethods = [
      'okta',
      'persona',
      'manual',
      'devel'
    ];

    const setCredentials = credentials => {
      this.setState({ signinMenuOpen: false });
      auth.saveCredentials(credentials);
    };

    const showMessage = ({ title, body }) => {
      this.setState({
        credentialsMessage: { title, body },
        signinMenuOpen: false
      });
    };

    const showManualModal = () => {
      this.setState({
        showManualModal: true
      });
    };

    const signinItems = signinMethods.map(meth =>
      SIGNIN_MENU_ITEMS[meth]({
        setCredentials,
        showMessage,
        showManualModal,
        key: `${meth}-menu-item`
      })
    );

    return (
      <NavDropdown key={2} title={menuHeading}
          ref="credentials" id="credentials"
          open={this.state.signinMenuOpen}
          // Due to https://github.com/react-bootstrap/react-bootstrap/issues/1301,
          // handle expanding and collapsing this manually
          onToggle={expanded => this.setState({ signinMenuOpen: expanded })}>
        <MenuItem href="/credentials/">
          <Icon name="key"/> Manage Credentials
        </MenuItem>
        <MenuItem divider />
        { signinItems }
        <MenuItem divider />
        <NavItem className={disabledIfNotSignedIn} onSelect={this.signOut}>
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

  renderManualModal() {
    // This modal must be outside of the "Sign In Manually" menu option as that
    // menu option is removed from the DOM as soon as it loses focus.
    const closeModal = () => {
      this.setState({ showManualModal: false });
    };

    const submitForm = e => {
      let certificate;

      e.preventDefault();

      if (this.state.manualCertificate !== '') {
        try {
          certificate = JSON.parse(this.state.manualCertificate);
        } catch (err) {
          return;
        }
      }
      auth.saveCredentials({
        clientId: this.state.manualClientId,
        accessToken: this.state.manualAccessToken,
        certificate
      });
      this.setState({
        signinMenuOpen: false,
        showManualModal: false
      });
    };

    const certificateIsValid = () => {
      const manualCertificate = this.state.manualCertificate;
      if (manualCertificate !== '') {
        try {
          JSON.parse(manualCertificate);
        } catch (err) {
          return false;
        }
      }
      return true;
    };

    const formIsValid = () =>
      this.state.manualClientId && this.state.manualAccessToken && certificateIsValid();

    return this.state.showManualModal ? (
      <Modal show={true}>
        <form className="login-form" onSubmit={submitForm}>
          <Modal.Header><h4>Manual Sign-In</h4></Modal.Header>
          <Modal.Body>
            <FormGroup controlId="clientId">
              <ControlLabel>Client Id</ControlLabel>
              <FormControl className="top-element" ref="clientId"
                name="clientId" type="text" placeholder="clientId" required
                onChange={e => this.setState({ manualClientId: e.target.value })} />
            </FormGroup>
            <FormGroup controlId="accessToken">
              <ControlLabel>Access Token</ControlLabel>
              <FormControl className="mid-element" ref="accessToken"
                name="accessToken" type="password" placeholder="accessToken"
                required onChange={e => this.setState({ manualAccessToken: e.target.value })} />
            </FormGroup>
            <FormGroup controlId="certificate">
              <ControlLabel>Certificate</ControlLabel>
              <FormControl componentClass="textarea" className="bottom-element" ref="certificate"
                name="certificate" rows={8} placeholder="JSON certificate (if required)"
                onChange={e => this.setState({ manualCertificate: e.target.value })}/>
            </FormGroup>
            <p className="text-muted">Note that the credentials are not checked for validity!</p>
          </Modal.Body>
          <Modal.Footer>
            <Button bsStyle="default" onClick={closeModal}>Cancel</Button>
            <Button type="submit" bsStyle="primary" disabled={!formIsValid()}>
              <Glyphicon glyph="paste"/> Sign In
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    ) : null;
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
