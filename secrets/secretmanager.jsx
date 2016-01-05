var React            = require('react');
var bs               = require('react-bootstrap');
var utils            = require('../lib/utils');
var taskcluster      = require('taskcluster-client');

var SecretsManager = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        secrets:       taskcluster.Secrets
      }
    }),
  ],

  /** Create an initial state */
  getInitialState: function () {
    return {
      name:    undefined,
      value:   undefined,
      error:   null,
    };
  },

  /** Render the main layout of the secrets manager page */
  render: function () {
    try {
    // display errors from operations
    if (this.state.error) {
      return (
        <bs.Alert bsStyle="danger" onDismiss={this.dismissError}>
          <strong>Error executing operation</strong><br />
          {this.state.error.toString()}
        </bs.Alert>
      );
    }

    return (
      <div>
       <h3>Secrets</h3>
       <p>This is a very simple interface to the key/value secret store.  Listing secrets is currently not supported,
       so you must enter the secret name here.</p>
       <div className="form-horizontal">
         <div className="form-group">
           <label className="control-label col-md-2">Secret Name</label>
           <div className="col-md-10">
             <input type="text" className="form-control"
                    ref="name" value={this.state.name}
                    placeholder="garbage/<ircnick>/my-secret" />
           </div>
         </div>
         <div className="form-group">
           <label className="control-label col-md-2">Secret Value</label>
           <div className="col-md-10">
             {
               // TODO: use the code editor
               this.state.editing ?
                 <textarea rows="10" className="form-control" ref="value">{JSON.stringify(this.state.value, null, 2)}</textarea>
               : this.state.value !== undefined ?
                 <pre>{JSON.stringify(this.state.value, null, 2)}</pre>
               : <em>none</em>
             }
           </div>
         </div>
       </div>
       <bs.ButtonToolbar>
         <bs.Button bsStyle="primary" onClick={this.getSecret}>
           <bs.Glyphicon glyph="search"/>
           &nbsp;
           Get
         </bs.Button>
         <bs.Button bsStyle="primary" onClick={this.editSecret} disabled={this.state.editing}>
           <bs.Glyphicon glyph="pencil"/>
           &nbsp;
           Edit
         </bs.Button>
         <bs.Button bsStyle="primary" onClick={this.setSecret} disabled={!this.state.editing}>
           <bs.Glyphicon glyph="ok"/>
           &nbsp;
           Set
         </bs.Button>
         <bs.Button bsStyle="primary" onClick={this.updateSecret} disabled={!this.state.editing}>
           <bs.Glyphicon glyph="ok"/>
           &nbsp;
           Update
         </bs.Button>
         <bs.Button bsStyle="primary" onClick={this.removeSecret}>
           <bs.Glyphicon glyph="trash"/>
           &nbsp;
           Remove
         </bs.Button>
       </bs.ButtonToolbar>
      </div>
    );
    } catch (e) {
        console.log(e);
        return (<span>error in render - see console</span>);
    }
  },

  async getSecret() {
    var name = this.refs.name.getDOMNode().value;
    this.secrets.get(name).then(
        value => this.setState({editing: false, value: value.secret, expires: value.expires}),
        this.showError);
  },

  async editSecret() {
    var name = this.refs.name.getDOMNode().value;
    this.secrets.get(name).then(
        value => this.setState({editing: true, value: value.secret, expires: value.expires}),
        err => this.setState({editing: true, value: {}, expires: undefined}))
  },

  async setSecret() {
    var name = this.refs.name.getDOMNode().value;
    var value = JSON.parse(this.refs.value.getDOMNode().value);
    this.secrets.set(name, {secret: value, expires: taskcluster.fromNow("1 day")}).then(
        x => this.setState({editing: false, value: value}),
        this.showError)
  },

  async updateSecret() {
    var name = this.refs.name.getDOMNode().value;
    var value = JSON.parse(this.refs.value.getDOMNode().value);
    this.secrets.update(name, {secret: value, expires: taskcluster.fromNow("1 day")}).then(
        x => this.setState({editing: false, value: value}),
        this.showError)
  },

  async removeSecret() {
    var name = this.refs.name.getDOMNode().value;
    this.secrets.remove(name).then(
        value => this.setState({editing: false, value: null}),
        this.showError)
  },

  showError(err) {
    console.log(err);
    this.setState({
      error: err,
      value: undefined // clear the value, just to be safe
    });
  },

  dismissError() {
    this.setState({
      error:        null
    });
  }
});

// Export SecretsManager
module.exports = SecretsManager;
