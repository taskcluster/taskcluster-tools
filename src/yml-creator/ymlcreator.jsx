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

export default class YmlCreator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rootName: '',
      rootDescription: '',
      tasks: [],
      events: [],
      image: 'node:6',
      commands: ['/bin/bash',
        '--login',
        '-c',
        'git clone {{event.head.repo.url}} repo && cd repo && git checkout {{event.head.sha}}',
        'npm install . && npm test'],
      taskName: '',
      taskDescription: '',
      displayEditor: false,
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
              it here or in you favorite editor to add more bells and wistles - please refer to the 
              <a href="https://docs.taskcluster.net/manual/integrations/github#a-simple-taskcluster-yml-file">full documentation on our configuration files</a>.
            </p>
            <p>
              <em>Attention!</em> TaskCluster begins accepting jobs as soon as a <code>.taskcluster.yml</code> exists 
              in your repository. However, if you want to see the status of TaskCluster jobs in
              your pushes, releases and pull requests, you have to install 
              <a href="https://github.com/integration/tc-cat"> TaskCluster-GitHub integration</a>.
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
                onBlur={this.saveTextInput} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Description:</ControlLabel>
              <FormControl
                type="text"
                placeholder="Description"
                name="rootDescription"
                onBlur={this.saveTextInput} />
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
                onBlur={this.saveTextInput} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Description:</ControlLabel>
              <FormControl
                type="text"
                placeholder="Description of the task"
                name="taskDescription"
                onBlur={this.saveTextInput} />
            </FormGroup>
          </Col>

          <Col md={7}>
            <FormGroup>
              <ControlLabel>Events:</ControlLabel>
              <Checkbox
                name="- pull_request.opened"
                onChange={this.eventsSelection}>
                Pull request opened
              </Checkbox>
              <Checkbox
                name="- pull_request.closed"
                onChange={this.eventsSelection}>
                Pull request merged or closed
              </Checkbox>
              <Checkbox
                name="- pull_request.synchronize"
                onChange={this.eventsSelection}>
                New commit made in an opened pull request
              </Checkbox>
              <Checkbox
                name="- pull_request.reopened"
                onChange={this.eventsSelection}>
                Pull request re-opened
              </Checkbox>
              <Checkbox
                name="- push"
                onChange={this.eventsSelection}>
                Push
              </Checkbox>
              <Checkbox
                name="- release"
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
                <option value="node:6">JavaScript with Node.js v.6</option>
                <option value="rail/python-test-runner">Python</option>
                <option value="jimmycuadra/rust:latest">Rust</option>
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
        </Row>

        <hr />

        <ButtonToolbar>
          <Button
            bsStyle="success"
            disabled="true">
            <Glyphicon glyph="plus" /> Define another task
          </Button>
          <Button
            bsStyle="primary"
            onClick={this.setDisplayEditor.bind(this, true)}>
            <Glyphicon glyph="ok" /> Create file
          </Button>
        </ButtonToolbar>

        <Col sm={12}>
          {this.state.displayEditor && this.renderEditor()}
        </Col>
      </Grid>
    );
  }

  saveTextInput(event) {
    this.setState({
      [event.target.name]: event.target.value,
    });
    console.log(this.state);
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

    console.log(eventsArray, this.state.events);
  }

  imageSelection(event) {
    this.setState({
      [event.target.name]: event.target.value});
  }

  commandsSelection(event) {
    if (event.target.value == 'standard') {
      this.setState({commands: [
        '/bin/bash',
        '--login',
        '-c',
        'git clone {{event.head.repo.url}} repo && cd repo && git checkout {{event.head.sha}}',
        'npm install . && npm test',
      ]});
    } else {
      this.setState({commands: []});
    }
  }

  setDisplayEditor(bool) {
    this.setState({displayEditor: bool});
  }

  renderEditor() {
    return (
      <CodeMirror
        ref="YMLeditor"
        lineNumbers={true}
        mode="application/json"
        textAreaClassName="form-control"
        textAreaStyle={{minHeight: '20em'}}
        value="{this.state.yml}"
        onChange={this.handleYMLChange}
        indentWithTabs={true}
        tabSize={2}
        lint={true}
        gutters={['CodeMirror-lint-markers']}
        theme="ambiance" />
    );
  }
}
