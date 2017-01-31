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
import './ymlcreator.less';
import CodeMirror from 'react-code-mirror';
import 'codemirror/mode/javascript/javascript';
import '../lib/codemirror/json-lint';

const initialYML = {
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

const standardSet = [
  '/bin/bash',
  '--login',
  '-c',
  'git clone {{event.head.repo.url}} repo && cd repo && git checkout {{event.head.sha}}',
  'npm install . && npm test'
];

export default class YmlCreator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rootName: '',
      rootDescription: '',
      tasks: [],
      events: [],
      image: 'node:6',
      commands: standardSet,
      taskName: '',
      taskDescription: '',

      PRoCheckbox: false,
      PRcCheckbox: false,
      PRsCheckbox: false,
      PRrCheckbox: false,
      pushCheckbox: false,
      relCheckbox: false,

      displayEditor: false,
      file: initialYML,
    };
    this.saveTextInput = this.saveTextInput.bind(this);
    this.eventsSelection = this.eventsSelection.bind(this);
    this.imageSelection = this.imageSelection.bind(this);
    this.commandsSelection = this.commandsSelection.bind(this);
    this.renderEditor = this.renderEditor.bind(this);
  }

  render() {
    return (
      <Grid fluid={true}>
        <Row>
          <Col sm={12}>
            <h4>Configuration File Creator</h4>
            <p>
              This tool lets you easily generate a simple generic <code>.taskcluster.yml</code> file, 
              which should live at the root of your repository. It defines
              tasks that you want TaskCluster to run for you. The tasks will run when certain 
              GitHub events happen — you will choose the events you're interested in while 
              creating the file. After pressing <b>Create file</b> button, you will see the contents of 
              your file appear at the bottom of this page. All you need to do is to copy it, go to 
              your repository, create a file at its root, paste and save 
              as <code>.taskcluster.yml</code>. Optionally, after you create your file, you can edit 
              it here or in you favorite editor to add more bells and wistles - please refer to 
              the <a href="https://docs.taskcluster.net/manual/integrations/github#a-simple-taskcluster-yml-file">
              full documentation on our configuration files</a>.
            </p>
            <p>
              <em>Attention!</em> TaskCluster begins accepting jobs as soon as a <code>.taskcluster.yml</code> exists 
              in your repository. However, if you want to see the status of TaskCluster jobs in
              your pushes, releases and pull requests, you have to install 
              <a href="https://github.com/integration/taskcluster-staging"> TaskCluster-GitHub integration</a>.
            </p>
            <hr />
          </Col>
        </Row>

        <Row>
          <Col sm={12}>
            <h5>Enter the name and desciption of your project or these tasks:</h5>
            <FormGroup>
              <ControlLabel>Name:</ControlLabel>
              <FormControl
                type="text"
                placeholder="Name"
                name="rootName"
                value={this.state.rootName}
                onChange={this.saveTextInput} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Description:</ControlLabel>
              <FormControl
                type="text"
                placeholder="Description"
                name="rootDescription"
                value={this.state.rootDescription}
                onChange={this.saveTextInput} />
            </FormGroup>
          </Col>
        </Row>

        <hr />

        <Row>
          <Col md={12}>
            <h5>Define your task:</h5>
          </Col>
          <Col md={5}>
            <FormGroup>
              <ControlLabel>Name:</ControlLabel>
              <FormControl
                type="text"
                placeholder="Name of the task"
                name="taskName"
                value={this.state.taskName}
                onChange={this.saveTextInput} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Description:</ControlLabel>
              <FormControl
                type="text"
                placeholder="Description of the task"
                name="taskDescription"
                value={this.state.taskDescription}
                onChange={this.saveTextInput} />
            </FormGroup>

            <FormGroup id="checkboxGroup">
              <ControlLabel>Events:</ControlLabel>
              <Checkbox
                name="pull_request.opened"
                id="PRoCheckbox"
                class="data_checkboxes"
                checked={this.state.PRoCheckbox}
                onChange={this.eventsSelection}>
                Pull request opened
              </Checkbox>
              <Checkbox
                name="pull_request.closed"
                id="PRcCheckbox"
                class="data_checkboxes"
                checked={this.state.PRcCheckbox}
                onChange={this.eventsSelection}>
                Pull request merged or closed
              </Checkbox>
              <Checkbox
                name="pull_request.synchronize"
                id="PRsCheckbox"
                class="data_checkboxes"
                checked={this.state.PRsCheckbox}
                onChange={this.eventsSelection}>
                New commit made in an opened pull request
              </Checkbox>
              <Checkbox
                name="pull_request.reopened"
                id="PRrCheckbox"
                class="data_checkboxes"
                checked={this.state.PRrCheckbox}
                onChange={this.eventsSelection}>
                Pull request re-opened
              </Checkbox>
              <Checkbox
                name="push"
                id="pushCheckbox"
                class="data_checkboxes"
                checked={this.state.pushCheckbox}
                onChange={this.eventsSelection}>
                Push
              </Checkbox>
              <Checkbox
                name="release"
                id="relCheckbox"
                class="data_checkboxes"
                checked={this.state.relCheckbox}
                onChange={this.eventsSelection}>
                Release or tag created
              </Checkbox>
            </FormGroup>

            <FormGroup>
              <ControlLabel>Language:</ControlLabel>
              <select
                class="yml"
                name="image"
                onChange={this.imageSelection}>
                <option value="node:6">JavaScript in Node.js v.6</option>
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
                onChange={this.commandsSelection}>
                <option value="standard">Clone repo and run my tests</option>
                <option value="custom">I'll define them myself</option>
              </select>
            </FormGroup>
          </Col>

          <Col md={7}>
            {this.state.displayEditor && this.renderEditor()}
          </Col>
        </Row>

        <hr />

        <ButtonToolbar>
          <Button
            bsStyle="info"
            disabled="true">
            <Glyphicon glyph="plus" /> Define another task
          </Button>
          <Button
            bsStyle="primary"
            onClick={this.setDisplayEditor.bind(this, true)}>
            <Glyphicon glyph="ok" /> Create file
          </Button>
          <Button
            bsStyle="danger"
            disabled={!this.state.displayEditor}
            onClick={this.resetDisplayEditor.bind(this, false)}>
            <Glyphicon glyph="repeat" /> Reset editor
          </Button>
        </ButtonToolbar>

      </Grid>
    );
  }

  saveTextInput(event) {
    this.setState({
      [event.target.name]: event.target.value,
    });
  }

  eventsSelection(event) {
    let eventsArray = this.state.events;
    const eventIndex = eventsArray.indexOf(event.target.name);
    if (eventIndex == -1) {
      eventsArray.push(event.target.name);
    } else {
      eventsArray.splice(eventIndex, 1);
    }
    this.setState({events: eventsArray});
    this.setState({
      [event.target.id]: !this.state[event.target.id]
    });
  }

  imageSelection(event) {
    this.setState({
      [event.target.name]: event.target.value});
  }

  commandsSelection(event) {
    if (event.target.value == 'standard') {
      this.setState({commands: standardSet});
    } else {
      this.setState({commands: []});
    }
  }

  setDisplayEditor(bool) {
    this.setState({displayEditor: bool});
  }

  resetDisplayEditor(bool) {
    this.setState({
      displayEditor: bool,
      rootName: '',
      rootDescription: '',
      tasks: [],
      events: [],
      image: 'node:6',
      commands: standardSet,
      taskName: '',
      taskDescription: '',
      PRoCheckbox: false,
      PRcCheckbox: false,
      PRsCheckbox: false,
      PRrCheckbox: false,
      pushCheckbox: false,
      relCheckbox: false,
    });
  }

  renderEditor() {
    let newYML = Object.create(null);
    Object.assign(newYML, initialYML);
    newYML.metadata.name = this.state.rootName;
    newYML.metadata.description = this.state.rootDescription;
    let task = Object.create(null);
    Object.assign(task, initialYML.tasks[0]);
    task.metadata.name = this.state.taskName;
    task.metadata.description = this.state.taskDescription;
    task.extra.github.events = this.state.events;
    task.payload.command = this.state.commands;
    task.payload.image = this.state.image;
    newYML.tasks = task;
    return (
      <CodeMirror
        ref="YMLeditor"
        lineNumbers={true}
        mode="application/json"
        textAreaClassName="form-control"
        textAreaStyle={{minHeight: '20em'}}
        value={JSON.stringify(newYML, null, 2)}
        onChange={this.handleYMLChange}
        indentWithTabs={true}
        tabSize={2}
        lint={true}
        gutters={['CodeMirror-lint-markers']}
        theme="ambiance" />
    );
  }
}
