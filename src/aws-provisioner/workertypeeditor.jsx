import React from 'react';
import { findDOMNode } from 'react-dom';
import { ButtonToolbar, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import * as utils from '../lib/utils';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';
import CodeMirror from 'react-code-mirror';
import ConfirmAction from '../lib/ui/confirmaction';
import 'codemirror/mode/javascript/javascript';
import '../lib/codemirror/json-lint';

/* eslint-disable no-param-reassign */
/** Encode/decode UserData property of object */
const encodeUserData = obj => {
  if (obj && obj.UserData) {
    obj.UserData = new Buffer(JSON.stringify(obj.UserData)).toString('base64');
  }
};
const decodeUserData = obj => {
  if (obj && obj.UserData) {
    obj.UserData = JSON.parse(new Buffer(obj.UserData, 'base64').toString());
  }
};
/* eslint-enable no-param-reassign */

const WorkerTypeEditor = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        awsProvisioner: taskcluster.AwsProvisioner
      },
      clientOpts: {
        awsProvisioner: {
          baseUrl: 'https://aws-provisioner.taskcluster.net/v1'
        }
      },
      reloadOnProps: ['definition', 'workerType']
    })
  ],

  propTypes: {
    // Callback to be called with workerType operated on as parameter
    updated: React.PropTypes.func.isRequired,
    // WorkerType to update, null of none
    workerType: React.PropTypes.string,
    definition: React.PropTypes.object.isRequired
  },

  getInitialState() {
    const def = _.cloneDeep(_.omit(this.props.definition, 'workerType'));
    // Decode UserData in-place modifying objects
    decodeUserData(def.launchSpecification);
    def.regions.map(_.property('overwrites')).forEach(decodeUserData);
    def.instanceTypes.map(_.property('overwrites')).forEach(decodeUserData);
    return {
      workerType: this.props.workerType,
      definition: JSON.stringify(def, null, 2),
      invalidDefinition: false
    };
  },

  render() {
    return (
      <div>
        {
          this.props.workerType ?
            <h3>Update <code>{this.props.workerType}</code></h3>
            : (
              <FormGroup validationState={this.workerTypeValidationState()}>
                <ControlLabel>WorkerType</ControlLabel>
                <div>
                  <FormControl
                    type="text"
                    ref="workerType"
                    placeholder="workerType"
                    value={this.state.workerType}
                    onChange={this.workerTypeChange} />
                </div>
              </FormGroup>
            )
        }
        <CodeMirror
          ref="definition"
          lineNumbers={true}
          mode="application/json"
          textAreaClassName="form-control"
          textAreaStyle={{ minHeight: '20em' }}
          value={this.state.definition}
          onChange={this.handleChange}
          indentWithTabs={true}
          tabSize={2}
          lint={true}
          gutters={['CodeMirror-lint-markers']}
          theme="ambiance"/>
        <br/>
        <ButtonToolbar>
          <ConfirmAction
            buttonStyle="primary"
            glyph="ok"
            label={this.props.workerType ? 'Update WorkerType' : 'Create WorkerType'}
            disabled={this.state.invalidDefinition ||
              this.workerTypeValidationState() === 'error'}
            action={this.props.workerType ? this.save : this.create}
            success="Saved Worker Type">
              Are you sure that you would like to {this.props.workerType ? 'update' : 'create'} the
              <code>{this.state.workerType}</code> workerType?
              <br/>
              If there is a minimum number of instances, they will be provisioned.
          </ConfirmAction>
          {
            this.props.workerType ? (
              <ConfirmAction
                buttonStyle="danger"
                glyph="remove"
                label="Remove WorkerType"
                action={this.remove}
                success="Removed WorkerType">
                  Are you sure you want to delete the <code>{this.props.workerType}</code>
                  workerType?
              </ConfirmAction>
            ) :
            null
          }
        </ButtonToolbar>
      </div>
    );
  },

  handleChange(e) {
    let invalid = false;

    try {
      JSON.parse(e.target.value);
    } catch (err) {
      invalid = true;
    }

    this.setState({
      definition: e.target.value,
      invalidDefinition: invalid
    });
  },

  workerTypeChange() {
    this.setState({
      workerType: findDOMNode(this.refs.workerType).value
    });
  },

  workerTypeValidationState() {
    return /^[a-zA-Z0-9_-]{1,22}$/.test(this.state.workerType) ?
      'success' :
      'error';
  },

  async save() {
    const def = JSON.parse(this.state.definition);
    /** * LEGACY NOTICE: This check and the actions it does are
         leftovers.  We'll soon be able to delete the check,
         the actions and the functions ***/
    if (def.launchSpecification) {
      encodeUserData(def.launchSpecification);
      def.regions.map(_.property('overwrites')).forEach(encodeUserData);
      def.instanceTypes.map(_.property('overwrites')).forEach(encodeUserData);
      /* END LEGACY */
    } else {
      delete def.lastModified; // Remember that the provisioner api sets this
    }
    await this.awsProvisioner.updateWorkerType(this.state.workerType, def);
    await this.props.updated(this.state.workerType);
  },

  async create() {
    const def = JSON.parse(this.state.definition);
    /** * LEGACY NOTICE: This check and the actions it does are
         leftovers.  We'll soon be able to delete the check,
         the actions and the functions ***/
    if (def.launchSpecification) {
      encodeUserData(def.launchSpecification);
      def.regions.map(_.property('overwrites')).forEach(encodeUserData);
      def.instanceTypes.map(_.property('overwrites')).forEach(encodeUserData);
      /* END LEGACY */
    } else {
      delete def.lastModified; // Remember that the provisioner api sets this
    }
    await this.awsProvisioner.createWorkerType(this.state.workerType, def);
    await this.props.updated(this.state.workerType);
  },

  async remove() {
    await this.awsProvisioner.removeWorkerType(this.props.workerType);
    await this.props.updated(this.props.workerType);
  }
});

export default WorkerTypeEditor;
