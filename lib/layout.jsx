var bs          = require('react-bootstrap');
var React       = require('react');
var $           = require('jquery');
var menu        = require('../menu');
var auth        = require('./auth');
var format      = require('./format');


/** Navigation bar for layout.jade */
var Navigation = React.createClass({
  /** Get initial state */
  getInitialState: function() {
    return {
      credentials:      auth.loadCredentials()
    };
  },

  /** Log-in open a authentication URL */
  login: function() {
    // Open login url
    window.open(auth.buildLoginURL(), '_blank');
  },

  /** Log out (clear credentials) */
  logout: function() {
    // Clear credentials
    auth.saveCredentials(undefined);
    // Update state
    this.setState({credentials: undefined});
  },

  /** Listen for credentials-changed events */
  componentDidMount: function() {
    window.addEventListener(
      'credentials-changed',
      this.handleCredentialsChanged,
      false
    );
  },

  /** Stop listening for credentials-changed events */
  componentWillUnmount: function() {
    window.removeEventListener(
      'credentials-changed',
      this.handleCredentialsChanged,
      false
    );
  },

  /** Credentials changed */
  handleCredentialsChanged: function(e) {
    // Reload credentials
    this.setState({credentials: e.detail});
  },

  /** Render navigation bar */
  render: function() {
    // Do a little branding
    var branding = (
      <a href="/">
        <img src="/lib/assets/taskcluster-36.png" width="36" height="36"/>
        &nbsp;
        TaskCluster Tools
      </a>
    );

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
      <bs.Navbar fluid={true} inverse={true} staticTop={true} brand={branding}>
        <div className="navbar-text">
          {
            activeEntry ? (
              <span>
                <format.Icon name={activeEntry.icon || 'wrench'} fixedWidth/>
                &nbsp;&nbsp;
                {activeEntry.title}
              </span>
            ): undefined
          }
        </div>
        <bs.Nav className="navbar-right">
          <bs.DropdownButton key={3} title="Tools">
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
          </bs.DropdownButton>
          {
            ( this.state.credentials ?
              <bs.NavItem onSelect={this.logout}>
                <bs.Glyphicon glyph="log-out"/>&nbsp;
                Log out
              </bs.NavItem>
            :
              <bs.NavItem onSelect={this.login}>
                <bs.Glyphicon glyph="log-in"/>&nbsp;
                Log in
              </bs.NavItem>
            )
          }
        </bs.Nav>
      </bs.Navbar>
    );
  }
});


/** Render Navigation */
$(function() {
  React.render(
    <Navigation/>,
    $('#navbar')[0]
  );
});
