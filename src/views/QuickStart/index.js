import React from 'react';
import { Row, Col, Form, FormGroup, FormControl, ControlLabel, Checkbox, ButtonToolbar, Button, Glyphicon }
  from 'react-bootstrap';
import { safeDump } from 'js-yaml';
import { Github } from 'taskcluster-client-web';
import CodeEditor from '../../components/CodeEditor';
import HelmetTitle from '../../components/HelmetTitle';
import { info } from './styles.css';

const initialYaml = {
  version: 0,
  tasks: [
    {
      provisionerId: '{{ taskcluster.docker.provisionerId }}',
      workerType: '{{ taskcluster.docker.workerType }}',
      extra: {
        github: {
          env: true,
          events: []
        }
      },
      payload: {
        maxRunTime: 3600,
        image: 'node',
        command: []
      },
      metadata: {
        name: '',
        description: '',
        owner: '{{ event.head.user.email }}',
        source: '{{ event.head.repo.url }}'
      }
    }
  ]
};

const baseCmd = [
  'git clone {{event.head.repo.url}} repo',
  'cd repo',
  'git config advice.detachedHead false',
  'git checkout {{event.head.sha}}'
];

const cmdDirectory = (type, org = '<YOUR_ORG>', repo = '<YOUR_REPO>') => ({
  node: [
    '/bin/bash',
    '--login',
    '-c',
    baseCmd.concat(['npm install .', 'npm test']).join(' && ')
  ],
  python: [
    '/bin/bash',
    '--login',
    '-c',
    baseCmd.concat(['pip install tox', 'tox']).join(' && ')
  ],
  'jimmycuadra/rust': [
    '/bin/bash',
    '--login',
    '-c',
    baseCmd.concat(['rustc --test unit_test.rs', './unit_test']).join(' && ')
  ],
  golang: [
    '/bin/bash',
    '--login',
    '-c',
    [
      `mkdir -p /go/src/github.com/${org}/${repo}`,
      `cd /go/src/github.com/${org}/${repo}`,
      'git init',
      'git fetch {{ event.head.repo.url }} {{ event.head.ref }}',
      'git config advice.detachedHead false',
      'git checkout {{ event.head.sha }}',
      'go install',
      'go test ./...'
    ].join(' && ')
  ]
})[type];

const githubClient = new Github({});

export default class YamlCreator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tasks: [],
      events: new Set(),
      image: 'node',
      commands: cmdDirectory('node'),
      currentCmd: cmdDirectory('node'),
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
      owner: '',
      repo: '',
      installedState: null
    };
  }


  saveTextInput = e => this.setState({
    [e.target.name]: e.target.value,
    resetActive: true
  });

  handleEventsSelection = (event) => {
    const events = new Set(this.state.events);

    events.has(event.target.name) ?
      events.delete(event.target.name) :
      events.add(event.target.name);

    this.setState({
      events: [...events],
      [event.target.id]: !this.state[event.target.id],
      resetActive: true
    });
  };

  handleImageSelection = (event) => {
    const currentCmd = cmdDirectory(event.target.value, this.state.owner, this.state.repo);
    this.setState({
      image: event.target.value,
      currentCmd,
      resetActive: true,
      commands: this.state.displayCmds ? currentCmd : []
    });
  };

  handleCommandsSelection = e => this.setState({
    displayCmds: e.target.value === 'standard',
    currentCmd: this.state.commands,
    commands: e.target.value === 'standard' ? this.state.commands : []
  });

  resetAll = () => this.setState({
    resetActive: false,
    tasks: [],
    events: new Set(),
    taskName: '',
    taskDescription: '',
    pullRequestOpened: false,
    pullRequestClosed: false,
    pullRequestSynchronized: false,
    pullRequestReopened: false,
    pushMade: false,
    releaseMade: false
  });

  renderEditor() {
    const newYaml = safeDump({
      ...initialYaml,
      tasks: [{
        ...initialYaml.tasks[0],
        ...{
          metadata: {
            ...initialYaml.tasks[0].metadata,
            name: this.state.taskName,
            description: this.state.taskDescription
          },
          extra: {
            github: {
              events: [...this.state.events]
            }
          },
          payload: {
            ...initialYaml.tasks[0].payload,
            command: this.state.commands,
            image: this.state.image
          }
        }
      }]
    });

    return (
      <div>
        <HelmetTitle title="Quick Start" />
        <hr />
        <CodeEditor mode="yaml" value={newYaml} />
      </div>
    );
  }

  installedStatus = (e) => {
    e.preventDefault();

    const { owner, repo } = this.state;

    if (!owner || !repo) {
      return this.setState({ installedState: null });
    }

    this.setState({ installedState: 'loading' }, async () => {
      const { installed } = await githubClient.repository(owner, repo);

      this.setState({ installedState: installed ? 'success' : 'error' });
    });
  };

  renderInfoText() {
    const { installedState } = this.state;

    if (!installedState) {
      return null;
    }

    if (installedState === 'loading') {
      return <p className="text-info">Searching...</p>;
    }

    return this.state.installedState === 'success' ?
      (
        <p className="text-success">
          You are all set!
        </p>
      ) :
      (
        <p className="text-danger">
          The integration has not been set up for this repository.
          Please contact the organization owner to have it set up!
        </p>
      );
  }

  render() {
    return (
      <div>
        <Row>
          <Col sm={12}>
            <h4>GitHub Quick-Start</h4>
            <p>
              This tool lets you easily generate a simple generic <code>.taskcluster.yml</code> file,
              which should live in the root of your repository. It defines
              tasks that you want Taskcluster to run for you. The tasks will run when certain
              GitHub events happen. You will choose the events you are interested in while
              creating the file.
            </p>
            <hr />
            <h5>For organization members: Check if your repository already has Taskcluster</h5>
            <Form onSubmit={this.installedStatus} inline>
              <FormGroup validationState={this.state.installedState === 'loading' ? null : this.state.installedState}>
                <FormControl
                  type="text"
                  name="owner"
                  placeholder="Enter organization name"
                  onChange={this.saveTextInput} />
                <FormControl.Feedback />
                {' '}/{' '}
                <FormControl
                  type="text"
                  name="repo"
                  placeholder="Enter repository name"
                  onChange={this.saveTextInput} />
                <FormControl.Feedback />
              </FormGroup>
              {' '}
              <Button type="submit" bsStyle="info">
                <Glyphicon glyph="question-sign" /> Check
              </Button>
              {this.renderInfoText()}
            </Form>
            <hr />
            <h5>For independent developers and organization owners: How to set up your repository with Taskcluster</h5>
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
                the <a href="https://github.com/apps/taskcluster" target="_blank" rel="noopener noreferrer">
                Taskcluster-GitHub integration</a>.
              </li>
            </ul>
            <p>
              Optionally, after you create your file, you can edit
              it here or in you favorite editor to add more functionality. Please refer to
              the <a href="https://docs.taskcluster.net/reference/integrations/github/docs/usage" target="_blank" rel="noopener noreferrer">
              full documentation on our configuration files</a>.
            </p>
            <hr />
          </Col>
        </Row>

        <Row>
          <Col md={5}>
            <h5>Define your task:</h5>
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
              <ControlLabel>This task should run when:</ControlLabel>
              <Checkbox
                name="pull_request.opened"
                id="pullRequestOpened"
                className="data_checkboxes"
                checked={this.state.pullRequestOpened}
                onChange={this.handleEventsSelection}>
                Pull request opened
              </Checkbox>
              <Checkbox
                name="pull_request.closed"
                id="pullRequestClosed"
                className="data_checkboxes"
                checked={this.state.pullRequestClosed}
                onChange={this.handleEventsSelection}>
                Pull request merged or closed
              </Checkbox>
              <Checkbox
                name="pull_request.synchronize"
                id="pullRequestSynchronized"
                className="data_checkboxes"
                checked={this.state.pullRequestSynchronized}
                onChange={this.handleEventsSelection}>
                New commit made in an opened pull request
              </Checkbox>
              <Checkbox
                name="pull_request.reopened"
                id="pullRequestReopened"
                className="data_checkboxes"
                checked={this.state.pullRequestReopened}
                onChange={this.handleEventsSelection}>
                Pull request re-opened
              </Checkbox>
              <Checkbox
                name="push"
                id="pushMade"
                className="data_checkboxes"
                checked={this.state.pushMade}
                onChange={this.handleEventsSelection}>
                Push
              </Checkbox>
              <Checkbox
                name="release"
                id="releaseMade"
                className="data_checkboxes"
                checked={this.state.releaseMade}
                onChange={this.handleEventsSelection}>
                Release or tag created
              </Checkbox>
            </FormGroup>

            <FormGroup>
              <ControlLabel>
                Language your project uses:
              </ControlLabel>
              <p className={info}>
                <Glyphicon glyph="info-sign" />&nbsp;
                This will select a corresponding docker image.
              </p>
              <FormControl componentClass="select" name="image" onChange={this.handleImageSelection}>
                <option value="node">Node.js</option>
                <option value="python">Python</option>
                <option value="jimmycuadra/rust">Rust</option>
                <option value="golang">Go</option>
              </FormControl>
            </FormGroup>

            <FormGroup>
              <ControlLabel>Commands: </ControlLabel>
              <FormControl componentClass="select" placeholder="Pick one..." onChange={this.handleCommandsSelection}>
                <option value="standard">Clone repo and run my tests</option>
                <option value="custom">I will define them myself</option>
              </FormControl>
            </FormGroup>
          </Col>
          <Col md={7}>
            <ButtonToolbar>
              <Button bsStyle="danger" disabled={!this.state.resetActive} onClick={this.resetAll}>
                <Glyphicon glyph="repeat" /> Reset form and file
              </Button>
            </ButtonToolbar>
            {this.renderEditor()}
          </Col>
        </Row>
      </div>
    );
  }
}
