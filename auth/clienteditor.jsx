/** @jsx React.DOM */
var React           = require('react');
var bs              = require('react-bootstrap');
var slugid          = require('slugid');
var taskcluster     = require('taskcluster-client');
var DateTimePicker  = require('react-widgets').DateTimePicker;
var utils           = require('../lib/utils');

/** Create client editor/viewer (same thing) */
var ClientEditor = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        auth:       taskcluster.Auth
      },
      reloadOnProps: ['currentClientId']
    })
  ],

  getDefaultProps: function() {
    return {
      currentClientId:  undefined     // undefined implies. "Create Client"
    };
  },

  getInitialState: function() {
    return {
      clientLoaded:   false,
      clientError:    undefined,
      client:         undefined
    };
  },

  /** Load initial state */
  load: function(props) {
    // If there is no currentClientId, we're creating a new client
    if (!props.currentClientId) {
      return {
        client: {
          clientId:       slugid.v4(),
          accessToken:    '-',
          scopes:         [],
          expires:        new Date(3015, 1, 1),
          name:           "",
          description:    ""
        }
      };
    } else {
      // Load currentClientId
      return {
        client:           this.auth.client(props.currentClientId)
      };
    }
  },

  render: function() {
    var isEditing = this.props.currentClientId !== undefined;
    return this.renderWaitFor('client') || (
      <span>
        <h1>{isEditing ? "Edit Client" : "Create New Client"}</h1>
        <hr/>
        <form className="form-horizontal">
          <div className="form-group">
            <label className="control-label col-md-3">ClientId</label>
            <div className="col-md-9">
              <div className="form-control-static">
                &nbsp;<code>{this.state.client.clientId}</code>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">AccessToken</label>
            <div className="col-md-9">
              <div className="form-control-static">
                &nbsp;<code>{this.state.client.accessToken}</code>
              </div>
            </div>
          </div>
          <bs.Input type="text"
                    label="Name"
                    ref="name"
                    value={this.state.client.name}
                    onChange={this.handleChange}
                    placeholder="Name"
                    labelClassName="col-md-3"
                    wrapperClassName="col-md-9"/>
          <bs.Input type="textarea"
                      label="Description"
                      ref="description"
                      onChange={this.handleChange}
                      value={this.state.client.description}
                      rows={8}
                      placeholder="Description in markdown..."
                      labelClassName="col-md-3"
                      wrapperClassName="col-md-9"/>
          <div className="form-group">
            <label className="control-label col-md-3">Expiry</label>
            <div className="col-md-9">
              <div className="form-control-static">
                <DateTimePicker/>
              </div>
            </div>
          </div>
        </form>
      </span>
    );
  },

  handleChange: function() {

  }
});

// Export ClientEditor
module.exports = ClientEditor;
