var React = require('react');
var bs = require('react-bootstrap');
var utils = require('../lib/utils');
var taskcluster = require('taskcluster-client');
var _ = require('lodash');
var CodeMirror = require('react-code-mirror');
var ConfirmAction = require('../lib/ui/confirmaction');

// temporary until we have an updated taskcluster-client with the new methods in it
var reference = require('./temp-aws-prov-reference');

require('codemirror/mode/javascript/javascript');
require('../lib/codemirror/json-lint');

/** Encode/decode UserData property of object */
var encodeUserData = (obj) => {
  if (obj && obj.UserData) {
    obj.UserData = new Buffer(JSON.stringify(obj.UserData)).toString('base64');
  }
};
var decodeUserData = (obj) => {
  if (obj && obj.UserData) {
    obj.UserData = JSON.parse(new Buffer(obj.UserData, 'base64').toString());
  }
};

var initialAmiSet = {
  amis: [{
    region: '...',
    hvm: '...',
    pv: '...'
  }]
};

/** Create amiSet editor/viewer (same thing) */
var AmiSetEditor = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        awsProvisioner: taskcluster.createClient(reference)
      },
      clientOpts: {
        awsProvisioner: {
          baseUrl: 'http://localhost:5557/v1'
        }
      },
      reloadOnProps: ['currentAmiSet']
    })
  ],

  propTypes: {
    // AmiSet to update, null of none
    amiSet: React.PropTypes.string,
    refreshAmiSetsList: React.PropTypes.func.isRequired,
    selectAmiSet: React.PropTypes.func.isRequired,
  },

  getDefaultProps() {
    return {
      currentAmiSet: ''
    };
  },

  getInitialState() {
    return {
      amiSetLoaded: false,
      amiSetError: null,
      amiSet: '',
      amis: initialAmiSet,
      editing: true,
      working: false,
      error: null,
      invalidAmis: []
    };
  },

  load() {
    // If there is no currentAmiSet, we're creating a new AMI Set
    if (!this.props.currentAmiSet) {
      return {
        amiSet: '',
        amis: initialAmiSet,
        invalidAmis: [],
        editing: true,
        working: false,
        error: null
      };
    } else {
      return {
        amiSet: this.props.currentAmiSet,
        amis: this.awsProvisioner.amiSet(this.props.currentAmiSet),
        invalidAmis: this.awsProvisioner.validateAmiSet(this.props.currentAmiSet),
        editing: false,
        working: false,
        error: null
      };
    }
  },

  render() {
    let isEditing = this.state.editing;
    let isCreating = isEditing && !this.props.currentAmiSet;

    if (this.state.error) {
      return (
        <bs.Alert bsStyle="danger" onDismiss={this.dismissError}>
          <strong>Error executing operation</strong>&nbsp;
          <p>
            {this.state.error.toString()}
          </p>
        </bs.Alert>
      );
    }

    return (
      <span>
        {
          this.props.currentAmiSet ? (
            <div>
              <h3>Update <code>{this.props.currentAmiSet}</code></h3>
              {
                isEditing ? (
                  <div>
                    {this.renderCodeEditor()}
                    <br/>
                    {this.renderEditingToolbar()}
                  </div>
                  ) : (
                  <span>
                    {
                      this.renderWaitFor('invalidAmis') || (
                        this.state.invalidAmis.length ? (
                          <bs.Alert bsStyle="danger">
                            <strong>DO NOT use this AMI set</strong>
                            <p>This AMI set contains the following invalid AMIs:</p>
                            <ul>
                            {
                              this.state.invalidAmis.map(ami => {
                                return (
                                  <li key={ami.imageId}><strong>{ami.imageId}</strong> ({ami.region})</li>
                                )
                              })
                            }
                            </ul>
                          </bs.Alert>
                        ) : (
                          <bs.Alert bsStyle="success">
                            All AMIs from this set are still valid.
                          </bs.Alert>
                        )
                      )
                    }
                    <pre>{JSON.stringify(_.pick(this.state.amis, ['amis']), null, 2)}</pre>
                    <bs.ButtonToolbar>
                      <bs.Button
                        bsStyle="success"
                        onClick={this.startEditing}>
                        <bs.Glyphicon glyph="pencil"/> Edit AMI Set
                      </bs.Button>
                      <bs.Button
                        bsStyle="info"
                        onClick={this.validateAmiSet}>
                        <bs.Glyphicon glyph="ok"/> Validate AMI Set
                      </bs.Button>
                    </bs.ButtonToolbar>
                  </span>
                )
              }
            </div>
          ) : (
            <div>
              <bs.Input
                type="text"
                value={this.state.amiSet}
                placeholder="amiSet"
                label="AmiSet"
                hasFeedback
                ref="amiSet"
                onChange={this.amiSetChange} />
              {this.renderCodeEditor()}
              <br/>
              <bs.ButtonToolbar>
                <ConfirmAction
                  buttonStyle="primary"
                  glyph="ok"
                  label={this.props.amiSet ? 'Update AmiSet' : 'Create AmiSet'}
                  action={this.props.amiSet ? this.save : this.create}
                  success="Saved AMI Set"
                  disabled={!this.state.amiSet}>
                    Are you sure that you would like to
                    {this.props.amiSet ? 'update' : 'create'}
                    the <code>{this.state.amiSet}</code> AMI Set?
                </ConfirmAction>
              </bs.ButtonToolbar>
            </div>
          )
        }
      </span>
    );
  },

  renderCodeEditor() {
    return (
      <CodeMirror
        ref="amis"
        lineNumbers={true}
        mode="application/json"
        textAreaClassName="form-control"
        textAreaStyle={{ minHeight: '20em' }}
        value={JSON.stringify(_.pick(this.state.amis, ['amis']), null, 2)}
        onChange={this.onAmiSetChange}
        indentWithTabs={true}
        tabSize={2}
        lint={true}
        gutters={['CodeMirror-lint-markers']}
        theme="ambiance" />
    );
  },

  renderEditingToolbar() {
    return (
      <bs.ButtonToolbar>
        <bs.Button
          bsStyle="success"
          onClick={this.saveAmiSet}
          disabled={this.state.working}>
          <bs.Glyphicon glyph="ok"/> Save Changes
        </bs.Button>
        <ConfirmAction
          buttonStyle="danger"
          glyph="trash"
          disabled={this.state.working}
          label="Delete AMI Set"
          action={this.deleteAmiSet}
          success="AMI Set deleted">
          Are you sure you want to delete AMI Set
          <code>{this.state.amiSet}</code>?
        </ConfirmAction>
      </bs.ButtonToolbar>
    );
  },

  startEditing() {
    this.setState({ editing: true });
  },

  onAmiSetChange(e) {
    this.setState({ amis: JSON.parse(e.target.value) });
  },

  amiSetChange() {
    this.setState({ amiSet: this.refs.amiSet.getValue() });
  },

  async validateAmiSet() {
    let invalidAmis = await this.awsProvisioner.validateAmiSet(this.props.currentAmiSet);
    this.setState({
      invalidAmis: invalidAmis
    });
  },

  async saveAmiSet() {
    try {
      await this.awsProvisioner.updateAmiSet(this.state.amiSet, this.state.amis);
      this.setState({
        editing: false,
        error: null
      });
    } catch(err) {
      this.setState({ error: err });
    }
  },

  async create() {
    try {
      await this.awsProvisioner.createAmiSet(this.state.amiSet, this.state.amis);
      this.setState({
        editing: false,
        error: null
      });
      this.props.selectAmiSet(this.state.amiSet);
      this.props.refreshAmiSetsList();
    } catch(err) {
      this.setState({ error: err });
    }
  },

  async deleteAmiSet() {
    await this.awsProvisioner.removeAmiSet(this.state.amiSet);
    this.props.selectAmiSet();
    this.props.refreshAmiSetsList();
  }
});

module.exports = AmiSetEditor;
