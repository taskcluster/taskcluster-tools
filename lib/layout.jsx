let bs          = require('react-bootstrap');
let React       = require('react');
let ReactDOM    = require('react-dom');
let $           = require('jquery');
let menu        = require('../menu');
let auth        = require('./auth');
let format      = require('./format');

/** Navigation bar for layout.jade */
let Navigation = React.createClass({
  /** Get initial state */
  getInitialState() {
    return {
      credentials:      auth.loadCredentials()
    };
  },

  /** Log-in open a authentication URL */
  login() {
    // Open login url
    window.open(auth.buildLoginURL(), '_blank');
  },

  /** Log out (clear credentials) */
  logout() {
    // Clear credentials
    auth.saveCredentials(undefined);
    // Update state
    this.setState({credentials: undefined});
  },

  /** Listen for credentials-changed events */
  componentDidMount() {
    window.addEventListener(
      'credentials-changed',
      this.handleCredentialsChanged,
      false
    );
  },

  /** Stop listening for credentials-changed events */
  componentWillUnmount() {
    window.removeEventListener(
      'credentials-changed',
      this.handleCredentialsChanged,
      false
    );
  },

  /** Credentials changed */
  handleCredentialsChanged(e) {
    // Reload credentials
    this.setState({credentials: e.detail});
  },

  /** Render navigation bar */
  render() {

    // Find active menu entry
    var activeEntry = menu.filter(function(entry) {
      return entry.link === window.location.pathname;
    }, this)[0] || {title: "Unknown Page"};
    // Remove title on landing page
    if (window.location.pathname === '/') {
      activeEntry = null;
    }

    // Construct the navbar
    return (
      <bs.Navbar fluid={true} inverse={true} staticTop={true}>
        <bs.Navbar.Header>
          <bs.Navbar.Brand>
            <a href="/">
              <img src="/lib/assets/taskcluster-36.png" width="36" height="36"/>
              &nbsp;
              TaskCluster Tools
            </a>
          </bs.Navbar.Brand>
        </bs.Navbar.Header>
        <bs.Navbar.Text>
          {
            activeEntry ? (
              <span>
                <format.Icon name={activeEntry.icon || 'wrench'} fixedWidth/>
                &nbsp;&nbsp;
                {activeEntry.title}
              </span>
            ): undefined
          }
        </bs.Navbar.Text>
        <bs.Nav pullRight={true}>
          <bs.NavDropdown key={1} title="Tools" id="tools">
            {
              menu.filter(entry => entry.display).map((entry, index) => {
                if (entry.type === 'divider') {
                  return <bs.MenuItem key={index} divider/>;
                }
                return (
                  <bs.MenuItem key={index} href={entry.link}>
                    <format.Icon
                      name={entry.icon || 'wrench'}
                      fixedWidth/>&nbsp;&nbsp;
                    {entry.title}
                  </bs.MenuItem>
                );
              })
            }
          </bs.NavDropdown>
          {this.renderCredentialsMenu()}
        </bs.Nav>
      </bs.Navbar>
    );
  },

  renderCredentialsMenu() {
    var menuHeading;
    if (this.state.credentials) {
      // TODO: color this according to time until expiry
      menuHeading = <span><bs.Glyphicon glyph='user'/>&nbsp; {this.state.credentials.clientId}</span>;
    } else {
      menuHeading = <span><bs.Glyphicon glyph='question-sign'/>&nbsp; no credentials</span>;
    }
    // TODO: "Log in via Okta", ".. Mozillians", etc.
    return <bs.NavDropdown key={2} title={menuHeading} id="credentials">
      <bs.MenuItem href="/preferences">
        <format.Icon name="cogs"/>&nbsp;Manage Credentials
      </bs.MenuItem>
      <bs.MenuItem divider />
      <bs.NavItem onSelect={this.login}>
        <bs.Glyphicon glyph="log-in"/>&nbsp;
        Log in
      </bs.NavItem>
    </bs.NavDropdown>;
  }
});


/** Render Navigation */
$(function() {
  ReactDOM.render(
    <Navigation/>,
    $('#navbar')[0]
  );
});
