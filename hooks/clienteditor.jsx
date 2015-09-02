var React           = require('react');
var bs              = require('react-bootstrap');
var slugid          = require('slugid');
var taskcluster     = require('taskcluster-client');
var DateTimePicker  = require('react-widgets').DateTimePicker;
var utils           = require('../lib/utils');
var format          = require('../lib/format');
var _               = require('lodash');
var ConfirmAction   = require('../lib/ui/confirmaction');
var Promise         = require('promise');
var TaskEditor      = require('./taskeditor');

var initialTask = {
  provisionerId:      'aws-provisioner-v1',
  workerType:         'b2gtest',
  created:            null, // later
  deadline:           null, // later
  payload: {
    image:            'ubuntu:13.10',
    command:          ['/bin/bash', '-c', 'echo "hello World"'],
    maxRunTime:       60 * 10
  },
  metadata: {
    name:             "Example Task",
    description:      "Markdown description of **what** this task does",
    owner:            "name@example.com",
    source:           "http://tools.taskcluster.net/task-creator/"
  }
};

var reference = require('./reference');
/** Create client editor/viewer (same thing) */
var ClientEditor = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        hooks:       taskcluster.createClient(reference)
      },
      reloadOnProps: ['currentHookId', 'currentGroupId']
    })
  ],

  propTypes: {
    // Method to refresh client list
    refreshClientList:  React.PropTypes.func.isRequired
  },

  getDefaultProps: function() {
    return {
      currentHookId:  undefined,     // undefined implies. "Create Client"
      currentGroupId: undefined
    };
  },

  getInitialState: function() {
    return {
      // Loading client or loaded client
      clientLoaded:     false,
      clientError:      undefined,
      client:           undefined,
      // Edit or viewing current state
      editing:          true,
      // Operation details, if currently doing anything
      working:          false,
      error:            null
    };
  },

  /** Load initial state */
  load: function() {
    // If there is no currentClientId, we're creating a new client
    if (!this.props.currentHookId || !this.props.currentGroupId) {
      return {
        client: {
          groupId:        "",
          hookId:         "",
          expires:        "",
          schedule:       "",
          metadata: {
            name:           "",
            description:    ""
          },
          task:           ""
        },
        editing:          true,
        working:          false,
        error:            null
      };
    } else {
      // Load currentClientId
      return {
        client:           this.hooks.hook(this.props.currentGroupId, this.props.currentHookId),
        editing:          false,
        working:          false,
        error:            null
      };
    }
  },

  render: function() {
    // display errors from operations
    if (this.state.error) {
      return (
        <bs.Alert bsStyle="danger" onDismiss={this.dismissError}>
          <strong>Error executing operation</strong>
          {this.state.error.toString()}
        </bs.Alert>
      );
    }
    var isCreating          = (this.props.currentClientId === undefined ||
                               this.props.currentGroupId  === undefined);
    var isEditing           = (isCreating || this.state.editing);
    var title               = "Create New Hook";
    if (!isCreating) {
      title = (isEditing ? "Edit Hook" : "View Hook");
    }
    return this.renderWaitFor('client') || (
      <span className="client-editor">
        <h3>{title}</h3>
        <hr style={{marginBottom: 10}}/>
        <div className="form-horizontal">
          <div className="form-group">
            <label className="control-label col-md-3">GroupId</label>
            <div className="col-md-9">
                {
                  isEditing ?
                    <input type="text"
                      className="form-control"
                      ref="groupId"
                      value={this.state.client.groupId}
                      onChange={this.onChange}
                      placeholder="groupId"/>
                  :
                    <div className="form-control-static">
                      {this.state.client.groupId}
                    </div>
                }
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">HookId</label>
            <div className="col-md-9">
                {
                  isEditing ?
                    <input type="text"
                      className="form-control"
                      ref="hookId"
                      value={this.state.client.hookId}
                      onChange={this.onChange}
                      placeholder="hookId"/>
                  :
                    <div className="form-control-static">
                      {this.state.client.hookId}
                    </div>
                }
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">Name</label>
            <div className="col-md-9">
                {
                  isEditing ?
                    <input type="text"
                      className="form-control"
                      ref="name"
                      value={this.state.client.metadata.name}
                      onChange={this.onChange}
                      placeholder="Name"/>
                  :
                    <div className="form-control-static">
                      {this.state.client.metadata.name}
                    </div>
                }
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">Description</label>
            <div className="col-md-9">
              {isEditing ? this.renderDescEditor() : this.renderDesc()}
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">Task</label>
            <div className="col-md-9">
              <TaskEditor
                localStorageKey="hooks-manager/task"
                initialTaskValue={JSON.stringify(initialTask, null, '\t')}
                task={this.state.client.task}/>
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-md-3">Expires</label>
            <div className="col-md-9">
              <div className="form-control-static">
                {
                  isEditing ?
                    <DateTimePicker
                      format='dd, MMM yyyy HH:mm'
                      value={new Date(this.state.client.expires)}
                      onChange={this.onExpiresChange}/>
                  :
                    <format.DateView date={this.state.client.expires}/>
                }
              </div>
            </div>
          </div>
        </div>
      </span>
    );
  },

  /** Render description editor */
  renderDescEditor: function() {
    return (
      <textarea className="form-control"
                ref="description"
                value={this.state.client.metadata.description}
                onChange={this.onChange}
                rows={8}
                placeholder="Description in markdown...">
      </textarea>
    );
  },

  /** Render description */
  renderDesc: function() {
    return (
      <div className="form-control-static">
        <format.Markdown>{this.state.client.metadata.description}</format.Markdown>
      </div>
    );
  },

  /** Handle changes in the editor */
  onChange: function() {
    var state = _.cloneDeep(this.state);
    state.client.description  = this.refs.description.getDOMNode().value;
    state.client.name         = this.refs.name.getDOMNode().value;
    this.setState(state);
  },

  /** When expires exchanges in the editor */
  onExpiresChange: function(date) {
    if (date instanceof Date) {
      var state = _.cloneDeep(this.state);
      state.client.expires = date.toJSON();
      this.setState(state);
    }
  },

  /** Start editing */
  startEditing: function() {
    this.setState({editing: true});
  },

  /** Create new client */
  createClient: function() {
    this.setState({working: true});
    this.auth.createClient(this.state.client.clientId, {
      scopes:       this.state.client.scopes,
      name:         this.state.client.name,
      description:  this.state.client.description,
      expires:      this.state.client.expires,
    }).then(function(client) {
      this.setState({
        client:         client,
        newAccessToken: client.accessToken,
        editing:        false,
        working:        false,
        error:          null
      });
      this.props.refreshClientList();
      //this.reload();
    }.bind(this), function(err) {
      this.setState({
        working:  false,
        error:    err
      });
    }.bind(this));
  },

  /** Save current client */
  saveClient() {
    this.loadState({
      client:     this.auth.modifyClient(this.state.client.clientId, {
        scopes:       this.state.client.scopes,
        name:         this.state.client.name,
        description:  this.state.client.description,
        expires:      this.state.client.expires,
      }),
      editing:    false
    });
  },

  /** Delete current client */
  async deleteClient() {
    await this.auth.removeClient(this.state.client.clientId);
    await Promise.all([this.props.refreshClientList(), this.reload()]);
  },

  /** Reset error state from operation*/
  dismissError() {
    this.setState({
      working:      false,
      error:        null
    });
  }
});

// Export ClientEditor
module.exports = ClientEditor;
