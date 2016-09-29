import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  Alert,
  ButtonToolbar,
  Button,
  Glyphicon,
  FormGroup,
  ControlLabel,
  FormControl
} from 'react-bootstrap';
import * as utils from '../lib/utils';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import CodeMirror from 'react-code-mirror';
import ConfirmAction from '../lib/ui/confirmaction';
// temporary until we have an updated taskcluster-client with the new methods in it
import reference from './temp-aws-prov-reference';
import 'codemirror/mode/javascript/javascript';
import '../lib/codemirror/json-lint';
import './amiseteditor.less';

const initialAmiSet = {
  amis: [{
    region: '...',
    hvm: '...',
    pv: '...'
  }]
};

/** Create amiSet editor/viewer (same thing) */
const AmiSetEditor = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        awsProvisioner: taskcluster.createClient(reference)
      },
      clientOpts: {
        awsProvisioner: {
          baseUrl: 'https://aws-provisioner.taskcluster.net/v1'
        }
      },
      reloadOnProps: ['currentAmiSet']
    })
  ],

  propTypes: {
    // AmiSet to update, null of none
    amiSet: React.PropTypes.string,
    refreshAmiSetsList: React.PropTypes.func.isRequired,
    selectAmiSet: React.PropTypes.func.isRequired
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
      error: null
    };
  },

  load() {
    // If there is no currentAmiSet, we're creating a new AMI Set
    if (!this.props.currentAmiSet) {
      return {
        amiSet: '',
        amis: initialAmiSet,
        editing: true,
        working: false,
        error: null
      };
    }

    return {
      amiSet: this.props.currentAmiSet,
      amis: this.awsProvisioner.amiSet(this.props.currentAmiSet),
      editing: false,
      working: false,
      error: null
    };
  },

  render() {
    const isEditing = this.state.editing;

    if (this.state.error) {
      return (
        <Alert bsStyle="danger" onDismiss={this.dismissError}>
          <strong>Error executing operation</strong>
          <p>
            {this.state.error.toString()}
          </p>
        </Alert>
      );
    }

    return (
      <div>
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
                    <pre>{JSON.stringify(_.pick(this.state.amis, ['amis']), null, 2)}</pre>
                    <ButtonToolbar>
                      <Button
                        bsStyle="success"
                        onClick={this.startEditing}>
                        <Glyphicon glyph="pencil"/> Edit AMI Set
                      </Button>
                    </ButtonToolbar>
                  </span>
                )
              }
            </div>
          ) : (
            <div>
              <FormGroup>
                <ControlLabel>AmiSet</ControlLabel>
                <FormControl
                  type="text"
                  placeholder="amiSet"
                  value={this.state.amiSet || ''}
                  ref="amiSet"
                  onChange={this.amiSetChange}/>
                <FormControl.Feedback />
              </FormGroup>
              {this.renderCodeEditor()}
              <br/>
              <ButtonToolbar>
                <ConfirmAction
                  buttonStyle="primary"
                  glyph="ok"
                  label={this.props.amiSet ? 'Update AmiSet' : 'Create AmiSet'}
                  action={this.props.amiSet ? this.save : this.create}
                  success="Saved AMI Set"
                  disabled={!this.state.amiSet}>
                    Are you sure that you would like to {this.props.amiSet ? 'update' : 'create'}
                    the <code>{this.state.amiSet}</code> AMI Set?
                </ConfirmAction>
              </ButtonToolbar>
            </div>
          )
        }
      </div>
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
        theme="ambiance"/>
    );
  },

  renderEditingToolbar() {
    return (
      <ButtonToolbar>
        <Button
          bsStyle="success"
          onClick={this.saveAmiSet}
          disabled={this.state.working}>
            <Glyphicon glyph="ok"/> Save Changes
        </Button>
        <ConfirmAction
          buttonStyle="danger"
          glyph="trash"
          disabled={this.state.working}
          label="Delete AMI Set"
          action={this.deleteAmiSet}
          success="AMI Set deleted">
            Are you sure you want to delete AMI Set <code>{this.state.amiSet}</code>?
        </ConfirmAction>
      </ButtonToolbar>
    );
  },

  startEditing() {
    this.setState({ editing: true });
  },

  onAmiSetChange(e) {
    this.setState({ amis: JSON.parse(e.target.value) });
  },

  amiSetChange() {
    this.setState({ amiSet: findDOMNode(this.refs.amiSet).value });
  },

  async saveAmiSet() {
    try {
      await this.awsProvisioner.updateAmiSet(this.state.amiSet, this.state.amis);

      this.setState({
        editing: false,
        error: null
      });
    } catch (err) {
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
    } catch (err) {
      this.setState({ error: err });
    }
  },

  async deleteAmiSet() {
    await this.awsProvisioner.removeAmiSet(this.state.amiSet);
    this.props.selectAmiSet();
    this.props.refreshAmiSetsList();
  }
});

export default AmiSetEditor;
