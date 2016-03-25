var React            = require('react');
var bs               = require('react-bootstrap');
var utils            = require('../lib/utils');
var taskcluster      = require('taskcluster-client');
var format           = require('../lib/format');
var ConfirmAction    = require('../lib/ui/confirmaction');
var TimeInput        = require('../lib/ui/timeinput');
var _                = require('lodash');
var moment          = require('moment');

var SecretEditor = React.createClass({
  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        secrets:       taskcluster.Secrets
      },
      reloadOnProps: ['currentSecretId']
    })
  ],

  propTypes: {
    // Method to reload a client in the parent
    reloadSecrets:  React.PropTypes.func.isRequired
  },

  getDefaultProps() {
    return {
      currentSecretId:  ''     // '' implies. "Create Secret"
    };
  },

  getInitialState() {
    return {
      // Loading secret or loaded secret
      secretLoaded:       false,
      secretError:        undefined,
      secret:             {},

      // Edit or viewing current state
      editing:          true,

      // Operation details, if currently doing anything
      working:          false,
      error:            null,
      showSecret:       false
    };
  },

  /** Load initial state */
  load() {
    // If there is no currentSecretId, we're creating a new secret
    if (this.props.currentSecretId === '') {
      return {
        secretId:         '',
        secret: {
          secret:         {},
          expires:        taskcluster.fromNow('1 day'),
        },
        editing:          true,
        working:          false,
        error:            null,
      };
    } else {
      // Load currentSecretId
      return {
        secretId:         this.props.currentSecretId,
        secret:           this.secrets.get(this.props.currentSecretId),
        editing:          false,
        working:          false,
        error:            null,
        showSecret:       false
      };
    }
  },

  render: function () {
    try {
    // display errors from operations
    if (this.state.error || this.state.secretError) {
      var error = this.state.error || this.state.secretError;
      return (
        <bs.Alert bsStyle="danger" onDismiss={this.dismissError}>
          <strong>Error executing operation</strong><br />
          {error.toString()}
        </bs.Alert>
      );
    }

    if (!this.state.secretLoaded) {
      return this.renderWaitFor('secret');
    }

    let isEditing = this.state.editing;
    let isCreating = isEditing && !this.props.currentSecretId;


    return (
      <div>
       <div className="form-horizontal">
         <div className="form-group">
           <label className="control-label col-md-2">Secret Name</label>
           <div className="col-md-10">
           { isCreating? (
               <div>
                 <input type="text" className="form-control" ref="name"
                        placeholder="garbage/<ircnick>/my-secret" />
                 <p className="text-muted">Note that secrets starting with "garbage/" are visible to just about everybody.  Use them to experiment, but not for real secrets!</p>
               </div>
             ) : (
                <div className="form-control-static">
                  {this.state.secretId}
                </div>
             )
           }
           </div>
         </div>
         <div className="form-group">
           <label className="control-label col-md-2">Expires</label>
           <div className="col-md-10">
                {
                  isEditing ?
                    <TimeInput
                      format='YYYY-MM-DD HH:mm:ss ZZ'
                      value={moment(new Date(this.state.secret.expires))}
                      onChange={this.onExpiresChange}
                      className="form-control" />
                  :
                    <format.DateView date={this.state.secret.expires}/>
                }
           </div>
         </div>
         <div className="form-group">
           <label className="control-label col-md-2">Secret Value (JSON Object)</label>
           <div className="col-md-10">
             {
               // TODO: use the code editor
               this.state.editing ?
                 <textarea rows="10" className="form-control" ref="value" defaultValue={JSON.stringify(this.state.secret.secret, null, 2)} />
               : this.state.secret.secret !== undefined ?
                 this.state.showSecret ?
                 <pre>{JSON.stringify(this.state.secret.secret, null, 2)}</pre>
                 :
                 <bs.Button
                    onClick={this.openSecret}
                    bsStyle="warning">
                    <format.Icon  name='user-secret'
                        style={{padding: '.15em'}}/>
                    &nbsp;Show secret
                 </bs.Button>
               : <em>none</em>
             }
           </div>
         </div>
       </div>
       { isEditing ? (
           <bs.ButtonToolbar>
             <bs.Button bsStyle="success"
                        onClick={this.saveSecret}
                        disabled={this.state.working}>
               <bs.Glyphicon glyph="ok"/>&nbsp;{
                 isCreating ? (
                   "Create Secret"
                 ) : (
                   "Save Changes"
                 )
               }
             </bs.Button>&nbsp;&nbsp;
             { isCreating ? undefined : (
             <ConfirmAction
               buttonStyle='danger'
               glyph='trash'
               disabled={this.state.working}
               label="Delete Secret"
               action={this.deleteSecret}
               success="Secret deleted">
               Are you sure you want to delete secret &nbsp;
               <code>{this.state.secretId}</code>?
             </ConfirmAction>) }
           </bs.ButtonToolbar>
         ) : (
          <bs.ButtonToolbar>
            <bs.Button bsStyle="success"
                       onClick={this.startEditing}
                       disabled={this.state.working}>
              <bs.Glyphicon glyph="pencil"/>&nbsp;Edit Secret
            </bs.Button>
          </bs.ButtonToolbar>
         )
       }
      </div>
    );
    } catch (e) {
        console.log(e);
        return (<span>error in render - see console</span>);
    }
  },

  onExpiresChange(date) {
    var state = _.cloneDeep(this.state);
    state.secret.expires = date.toDate().toJSON();
    console.log(this.state.secret.expires);
    this.setState(state);
  },

  startEditing() {
    this.setState({editing: true});
  },

  openSecret() {
    this.setState({showSecret: true});
  },

  async saveSecret() {
    var secretId = this.props.currentSecretId;
    var shouldReload = false;
    if (!secretId) {
      shouldReload = true; // adding a new secret, so reload to see it listed
      secretId = this.refs.name.getDOMNode().value;
    }
    if (!secretId) {
      return this.showError(new Error("secret name is required"));
    }

    var secret;
    try {
      secret = JSON.parse(this.refs.value.getDOMNode().value);
    } catch(e) {
      return this.showError(e);
    }

    var expires = this.state.secret.expires;

    this.secrets.set(secretId, {
      secret, expires
    }).then(() => {
      let newSecret = _.cloneDeep(this.state.secret);
      newSecret.secret = secret;
      newSecret.expires = expires;
      this.setState({
        secretId,
        editing: false,
        secret: newSecret,
      });
      if (shouldReload) {
        this.props.reloadSecrets();
      }
    })
    .catch(this.showError);
  },

  async deleteSecret() {
    this.secrets.remove(this.props.currentSecretId).then(
        this.props.reloadSecrets(),
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
      secretError:  null,
      error:        null
    });
  }
});

module.exports = SecretEditor;
