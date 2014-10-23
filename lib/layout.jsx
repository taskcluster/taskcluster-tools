/** @jsx React.DOM */
var bs          = require('react-bootstrap');
var React       = require('react');
var $           = require('jquery');
var menu        = require('../menu');
var url         = require('url');
var auth        = require('./auth');

/** Navigation bar for layout.jade */
var Navigation = React.createClass({
  getDefaultProps: function() {
    return {
      activePage:     ''
    };
  },

  /** Get initial state */
  getInitialState: function() {
    return {
      credentials:      auth.loadCredentials()
    };
  },

  /** Log-in open a authentication URL */
  login: function() {
    var target = url.format({
      protocol:       window.location.protocol,
      host:           window.location.host,
      pathname:       '/login'
    });
    var authUrl = url.format({
      protocol:       'http',
      host:           'localhost:60550',    // TODO: Fix this when deploying
      query: {
        target:       target,
        description: [
          "TaskCluster Tools offers various way to create and inspect both tasks",
          "and task-graphs."
        ].join('\n')
      }
    });

    // Open login url
    window.open(authUrl, '_blank');
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
    auth.on('credentials-changed', this.handleCredentialsChanged);
  },

  /** Stop listening for credentials-changed events */
  componentWillUnmount: function() {
    auth.removeListener('credentials-changed', this.handleCredentialsChanged);
  },

  /** Credentials changed */
  handleCredentialsChanged: function(credentials) {
    // Reload credentials
    this.setState({credentials: credentials});
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
      return entry.link === this.props.activePage;
    }, this)[0] || {title: "Unknown Page"};

    // Construct the navbar
    return (
      <bs.Navbar inverse={true} staticTop={true} brand={branding}>
        <div className="navbar-text">
          {activeEntry.title}
        </div>
        <bs.Nav className="navbar-right">
          <bs.DropdownButton key={3} title="Tools">
            {
              menu.map(function(entry, index) {
                if (entry.type === 'divider') {
                  return <bs.MenuItem key={index} divider/>;
                }
                return (
                  <bs.MenuItem key={index} href={entry.link}>
                    {entry.title}
                  </bs.MenuItem>
                );
              })
            }
          </bs.DropdownButton>
          {
            ( this.state.credentials ?
              <bs.NavItem onSelect={this.logout}>
                <bs.Glyphicon glyph="log-out"/>
                &nbsp;
                Log out
              </bs.NavItem>
            :
              <bs.NavItem onSelect={this.login}>
                <bs.Glyphicon glyph="log-in"/>
                &nbsp;
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
var renderNavigation = function(options) {
  $(function() {
    React.renderComponent(
      <Navigation activePage={options.activePage}/>,
      $('#navbar')[0]
    );
  });
};

// Export renderNavigation
exports.renderNavigation = renderNavigation;
