import React from 'react';
import {
  Grid,
  Row,
  Col,
  FormGroup,
  FormControl,
  ControlLabel,
  Checkbox,
  ButtonToolbar,
  Button,
  Glyphicon,
} from 'react-bootstrap';
import './yamlcreator.less';
import CodeMirror from 'react-code-mirror';
import 'codemirror/mode/yaml/yaml';
import '../lib/codemirror/yaml-lint';
import yaml from 'js-yaml';

const initialYaml = {
  version: 0,
  metadata: {
    name: '',
    description: '',
    owner: '{{ event.head.user.email }}',
    source: '{{ event.head.repo.url }}',
  },
  tasks: [
    {
      provisionerId: '{{ taskcluster.docker.provisionerId }}',
      workerType: '{{ taskcluster.docker.workerType }}',
      extra: {
        github: {
          env: true,
          events: [],
        },
      },
      payload: {
        maxRunTime: 3600,
        image: 'node:6',
        command: [],
      },
      metadata: {
        name: '',
        description: '',
        owner: '{{ event.head.user.email }}',
        source: '{{ event.head.repo.url }}',
      },
    },
  ],
};

const cmdDirectory = {
  'node:6': [
    '/bin/bash',
    '--login',
    '-c',
    'git clone {{event.head.repo.url}} repo && cd repo && git checkout {{event.head.sha}} && npm install . && npm test',
  ],
  'rail/python-test-runner': [
    '/bin/bash',
    '--login',
    '-c',
    'git clone {{event.head.repo.url}} repo && cd repo && git checkout {{event.head.sha}} && python setup.py test',
  ],
  'jimmycuadra/rust:latest': [
    '/bin/bash',
    '--login',
    '-c',
    'git clone {{event.head.repo.url}} repo && cd repo' +
    '&& git checkout {{event.head.sha}} && rustc --test unit_test.rs && ./unit_test',
  ],
  'golang:1.8': [
    '/bin/bash',
    '--login',
    '-c',
    'go get -t github.com/taskcluster/taskcluster-cli/... &&' +
    ' cd  /go/src/github.com/taskcluster/taskcluster-cli make && go test ./...',
  ],
};

export default class YamlCreator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rootName: '',
      rootDescription: '',
      tasks: [],
      events: new Set(),
      image: 'node:6',
      commands: cmdDirectory['node:6'],
      currentCmd: cmdDirectory['node:6'],
      displayCmds: true,
      taskName: '',
      taskDescription: '',
      pullRequestOpened: false,
      pullRequestClosed: false,
      pullRequestSynchronized: false,
      pullRequestReopened: false,
      pushMade: false,
      releaseMade: false,
      resetActive: false,
    };
  }

  render() {
    return (
      <Grid fluid={true}>
        <Row>
          <Col sm={12}>
            <h4>GitHub Quick-Start</h4>
            <p>
              This tool lets you easily generate a simple generic <code>.taskcluster.yml</code> file, 
              which should live in the root of your repository. It defines
              tasks that you want TaskCluster to run for you. The tasks will run when certain 
              GitHub events happen — you will choose the events you're interested in while 
              creating the file.
            </p>
            <hr />
            <h5>How to set up your repository with TaskCluster:</h5>
            <ul>
              <li>
                Fill out the form below. All
                changes in the form will instantly show up in the code field.
              </li>
              <li>
                When you are done editing, copy the contents of the code field and paste it into a file 
                named <code>.taskcluster.yml</code> in the root of your repository.
              </li>
              <li>
                Make sure to install 
                the <a href="https://github.com/integration/taskcluster"> TaskCluster-GitHub 
                integration</a>.
              </li>
            </ul>
            <p>
              Optionally, after you create your file, you can edit 
              it here or in you favorite editor to add more functonality. Please refer to 
              the <a href="https://docs.taskcluster.net/reference/integrations/github/docs/usage">
              full documentation on our configuration files</a>.
            </p>
            <hr />
          </Col>
        </Row>

        <Row>
          <Col md={5}>
            <h5>Enter the name and description of your project or these tasks:</h5>
            <p className="infoText">
              <Glyphicon glyph="info-sign" />&nbsp;
              These will appear at the top of the file and help the reader understand what they are seeing.
            </p>
            
            <FormGroup>
              <ControlLabel>Name:</ControlLabel>
              <FormControl
                type="text"
                placeholder="Name"
                name="rootName"
                value={this.state.rootName}
                onChange={e => this.saveTextInput(e)} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Description:</ControlLabel>
              <FormControl
                type="text"
                placeholder="Description"
                name="rootDescription"
                value={this.state.rootDescription}
                onChange={e => this.saveTextInput(e)} />
            </FormGroup>
            <hr />
            <h5>Define your task:</h5>
            <FormGroup>
              <ControlLabel>Name:</ControlLabel>
              <FormControl
                type="text"
                placeholder="Name of the task"
                name="taskName"
                value={this.state.taskName}
                onChange={e => this.saveTextInput(e)} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Description:</ControlLabel>
              <FormControl
                type="text"
                placeholder="Description of the task"
                name="taskDescription"
                value={this.state.taskDescription}
                onChange={e => this.saveTextInput(e)} />
            </FormGroup>

            <FormGroup id="checkboxGroup">
              <ControlLabel>This task should run when:</ControlLabel>
              <Checkbox
                name="pull_request.opened"
                id="pullRequestOpened"
                className="data_checkboxes"
                checked={this.state.pullRequestOpened}
                onChange={e => this.handleEventsSelection(e)}>
                Pull request opened
              </Checkbox>
              <Checkbox
                name="pull_request.closed"
                id="pullRequestClosed"
                className="data_checkboxes"
                checked={this.state.pullRequestClosed}
                onChange={e => this.handleEventsSelection(e)}>
                Pull request merged or closed
              </Checkbox>
              <Checkbox
                name="pull_request.synchronize"
                id="pullRequestSynchronized"
                className="data_checkboxes"
                checked={this.state.pullRequestSynchronized}
                onChange={e => this.handleEventsSelection(e)}>
                New commit made in an opened pull request
              </Checkbox>
              <Checkbox
                name="pull_request.reopened"
                id="pullRequestReopened"
                className="data_checkboxes"
                checked={this.state.pullRequestReopened}
                onChange={e => this.handleEventsSelection(e)}>
                Pull request re-opened
              </Checkbox>
              <Checkbox
                name="push"
                id="pushMade"
                className="data_checkboxes"
                checked={this.state.pushMade}
                onChange={e => this.handleEventsSelection(e)}>
                Push
              </Checkbox>
              <Checkbox
                name="release"
                id="releaseMade"
                className="data_checkboxes"
                checked={this.state.releaseMade}
                onChange={e => this.handleEventsSelection(e)}>
                Release or tag created
              </Checkbox>
            </FormGroup>

            <FormGroup>
              <ControlLabel>
                Language your project uses:
              </ControlLabel>
              <p className="infoText">
                <Glyphicon glyph="info-sign" />&nbsp;
                This will select a corresponding docker image.
              </p>
              <select
                name="image"
                onChange={e => this.handleImageSelection(e)}>
                <option value="node:6">JavaScript in Node.js v6</option>
                <option value="rail/python-test-runner">Python</option>
                <option value="jimmycuadra/rust:latest">Rust</option>
                <option value="golang:1.8">Go</option>
              </select>
            </FormGroup>

            <FormGroup>
              <ControlLabel>Commands: </ControlLabel>
              <select
                componentClass="select"
                placeholder="Pick one..."
                onChange={e => this.handleCommandsSelection(e)}>
                <option value="standard">Clone repo and run my tests</option>
                <option value="custom">I'll define them myself</option>
              </select>
            </FormGroup>
          </Col>
          <Col md={7}>
            <ButtonToolbar>
              <Button
                bsStyle="danger"
                disabled={!this.state.resetActive}
                onClick={() => this.resetAll()}>
                <Glyphicon glyph="repeat" /> Reset form and file
              </Button>
            </ButtonToolbar>
            {this.renderEditor()}
          </Col>
        </Row>

        <hr />

        <ButtonToolbar>
          <Button
            bsStyle="info"
            className="bottom"
            disabled="true"
            id="anotherTask">
            <Glyphicon glyph="plus" /> Define another task
          </Button>
        </ButtonToolbar>

      </Grid>
    );
  }

  saveTextInput(event) {
    this.setState({
      [event.target.name]: event.target.value,
      resetActive: true,
    });
  }

  handleEventsSelection(event) {
    const events = new Set(this.state.events);

    events.has(event.target.name) ?
      events.delete(event.target.name) :
      events.add(event.target.name);
    this.setState({
      events: [...events],
      [event.target.id]: !this.state[event.target.id],
      resetActive: true,
    });
  }

  handleImageSelection(event) {
    this.setState({
      image: event.target.value,
      currentCmd: cmdDirectory[event.target.value],
      resetActive: true,
      commands: this.state.displayCmds ? cmdDirectory[event.target.value] : [],
    });
  }

  handleCommandsSelection(event) {
    this.setState({
      displayCmds: event.target.value === 'standard',
      currentCmd: this.state.commands,
      commands: event.target.value === 'standard' ?
        this.state.commands :
        [],
    });
  }

  resetAll() {
    this.setState({
      resetActive: false,
      rootName: '',
      rootDescription: '',
      tasks: [],
      events: new Set(),
      taskName: '',
      taskDescription: '',
      pullRequestOpened: false,
      pullRequestClosed: false,
      pullRequestSynchronized: false,
      pullRequestReopened: false,
      pushMade: false,
      releaseMade: false,
    });
  }

  renderEditor() {
    const newYaml = yaml.safeDump({
      ...initialYaml,
      metadata: {
        ...initialYaml.metadata,
        name: this.state.rootName,
        description: this.state.rootDescription,
      },
      tasks: [{
        ...initialYaml.tasks[0],
        ...{
          metadata: {
            ...initialYaml.tasks[0].metadata,
            name: this.state.taskName,
            description: this.state.taskDescription,
          },
          extra: {
            github: {
              events: [...this.state.events],
            },
          },
          payload: {
            ...initialYaml.tasks[0].payload,
            command: this.state.commands,
            image: this.state.image,
          },
        },
      }],
    });
 
    return (
      <div>
        <hr />
        <CodeMirror
          ref="yamlEditor"
          lineNumbers={true}
          mode="yaml"
          textAreaClassName="form-control"
          textAreaStyle={{minHeight: '20em'}}
          value={newYaml}
          indentWithTabs={false}
          tabSize={2}
          lint={true}
          gutters={['CodeMirror-lint-markers']}
          theme="ambiance" />
      </div>
    );
  }
}
