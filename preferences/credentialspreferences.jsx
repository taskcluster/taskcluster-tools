var React       = require('react');
var bs          = require('react-bootstrap');
var auth        = require('../lib/auth');

/**
 * User interface for displaying credentials loaded, setting other credentials,
 * removing the credentials from the browser etc.
 */
var CredentialsPreferences = React.createClass({
  getInitialState: function() {
    return {
      parseError:       false
    };
  },

  /** Handle changes looks for parse errors */
  handleChange: function() {
    // Parse certificate to see if it is valid
    var parseError = false;
    if (this.refs.temporary.getChecked()) {
      try {
        JSON.parse(this.refs.certificate.getValue());
      }
      catch(err) {
        parseError = true;
      }
    }
    // Set state
    this.setState({
      parseError:   parseError
    });
  },

  /** Save changes to localStorage */
  save: function() {
    // Construct credentials
    var credentials = {
      clientId:     this.refs.clientId.getValue(),
      accessToken:  this.refs.accessToken.getValue()
    };
    if (this.refs.temporary.getChecked()) {
      credentials.certificate = JSON.parse(this.refs.certificate.getValue());
    }
    // Save credentials
    auth.saveCredentials(credentials);
  },

  /** Removed credentials from localStorage */
  remove: function() {
    auth.saveCredentials(undefined);
    // Reset inputs
    this.refs.clientId.getInputDOMNode().value    = "";
    this.refs.accessToken.getInputDOMNode().value = "";
    this.refs.certificate.getInputDOMNode().value = "{}";
    this.refs.temporary.getInputDOMNode().checked = false;
    // Force update UI
    this.forceUpdate();
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

  /** handle changes to credentials */
  handleCredentialsChanged: function(e) {
    var creds = e.detail || {};
    // Update clients with new credentials
    var certificate = JSON.stringify(
      creds.certificate || {},
      null,
      2
    );
    var isTemporary = (creds.certificate ? true : false);
    this.refs.clientId.getInputDOMNode().value    = creds.clientId || '';
    this.refs.accessToken.getInputDOMNode().value = creds.accessToken || '';
    this.refs.certificate.getInputDOMNode().value = certificate;
    this.refs.temporary.getInputDOMNode().checked = isTemporary;
    this.forceUpdate();
  },

  render: function() {
    var creds = auth.loadCredentials() || {};
    var certificate = JSON.stringify(
      creds.certificate || {},
      null,
      2
    );
    var isTemporary = creds.certificate ? true : false;
    if (this.refs.temporary) {
      isTemporary = this.refs.temporary.getChecked();
    }
    return (
      <span>
        <h3>TaskCluster Credentials</h3>
        <p>
          Some tools and actions requires TaskCluster credentials, you can
          login to <code>auth.taskcluster.net</code> and obtain temporary
          credentials, or you can enter some static credentials here.
        </p>
        <form className="form-horizontal">
          <bs.Input type="text"
                    label="ClientId"
                    ref="clientId"
                    defaultValue={creds.clientId || ''}
                    placeholder="ClientId"
                    labelClassName="col-md-2"
                    wrapperClassName="col-md-10"/>
          <bs.Input type="text"
                    label="AccessToken"
                    ref="accessToken"
                    defaultValue={creds.accessToken || ''}
                    placeholder="AccessToken"
                    labelClassName="col-md-2"
                    wrapperClassName="col-md-10"/>
          <bs.Input type="textarea"
                    label="Certificate"
                    ref="certificate"
                    onChange={this.handleChange}
                    defaultValue={certificate}
                    disabled={!isTemporary}
                    rows={12}
                    bsStyle={this.state.parseError ? 'error' : undefined}
                    hasFeedback
                    placeholder="Certificate as JSON..."
                    labelClassName="col-md-2"
                    wrapperClassName="col-md-10"/>
          <bs.Input type="checkbox"
                    label="Temporary credentials"
                    ref="temporary"
                    onChange={this.handleChange}
                    defaultChecked={isTemporary}
                    wrapperClassName="col-xs-offset-2 col-xs-10"/>
          <div className="form-group">
            <div className="col-xs-offset-2 col-xs-10">
              <bs.ButtonToolbar>
                <bs.Button bsStyle="primary"
                           onClick={this.save}
                           disabled={this.state.parseError}>
                  Save Changes
                </bs.Button>
                <bs.OverlayTrigger placement="top"
                                   overlay={this.renderRemoveTooltip()}>
                  <bs.Button bsStyle="danger" onClick={this.remove}>
                    Remove
                  </bs.Button>
                </bs.OverlayTrigger>
              </bs.ButtonToolbar>
            </div>
          </div>
        </form>
      </span>
    );
  },

  /** Render tooltip for remove button */
  renderRemoveTooltip: function() {
    return (
      <bs.Tooltip>
        <strong>Remove</strong> credentials stored in <code>localStorage</code>
      </bs.Tooltip>
    );
  }
});

// Export CredentialsPreferences
module.exports = CredentialsPreferences;

