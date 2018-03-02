import { Component } from 'react';
import {
  Row,
  Col,
  Form,
  FormGroup,
  FormControl,
  ControlLabel,
  Checkbox,
  ButtonToolbar,
  Button,
  Glyphicon,
  Radio
} from 'react-bootstrap';
import { safeDump } from 'js-yaml';
import { Github } from 'taskcluster-client-web';
import CodeEditor from '../../components/CodeEditor';
import HelmetTitle from '../../components/HelmetTitle';
import { info } from './styles.module.css';

/* eslint-disable react/no-unused-state */

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
const cmdDirectory = (type, org = '<YOUR_ORG>', repo = '<YOUR_REPO>') =>
  ({
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
    'rust:latest': [
      '/bin/bash',
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
  }[type]);
const githubClient = new Github({});

export default class YamlCreator extends Component {
  static initialState = {
    resetActive: false,
    tasks: [],
    events: new Set([
      'pull_request.opened',
      'pull_request.reopened',
      'pull_request.synchronize'
    ]),
    taskName: '',
    taskDescription: ''
  };

  constructor(props) {
    super(props);
    this.state = {
      ...YamlCreator.initialState,
      image: 'node',
      commands: cmdDirectory('node'),
      currentCmd: cmdDirectory('node'),
      displayCmds: true,
      owner: '',
      repo: '',
      installedState: null,
      allowPullRequests: 'collaborators'
    };
  }

  handleSaveTextInput = e =>
    this.setState({
      [e.target.name]: e.target.value,
      resetActive: true
    });

  handleAllowPullRequestsSelection = event => {
    this.setState({
      allowPullRequests:
        event.target.id === 'prPublic' ? 'public' : 'collaborators'
    });
  };

  handleEventsSelection = event => {
    const events = new Set(this.state.events);

    events.has(event.target.name)
      ? events.delete(event.target.name)
      : events.add(event.target.name);

    this.setState({
      events,
      resetActive: true
    });
  };

  handleImageSelection = event => {
    const currentCmd = cmdDirectory(
      event.target.value,
      this.state.owner,
      this.state.repo
    );

    this.setState({
      image: event.target.value,
      currentCmd,
      resetActive: true,
      commands: this.state.displayCmds ? currentCmd : []
    });
  };

  handleCommandsSelection = e =>
    this.setState({
      displayCmds: e.target.value === 'standard',
      currentCmd: this.state.commands,
      commands:
        e.target.value === 'standard' ? cmdDirectory(this.state.image) : []
    });

  handleResetAll = () => {
    this.setState(YamlCreator.initialState);
  };

  renderEditor() {
    const newYaml = safeDump({
      ...initialYaml,
      allowPullRequests: this.state.allowPullRequests,
      tasks: [
        {
          ...initialYaml.tasks[0],
          ...{
            metadata: {
              ...initialYaml.tasks[0].metadata,
              name: this.state.taskName,
              description: this.state.taskDescription
            },
            extra: {
              github: {
                events: [...this.state.events].sort()
              }
            },
            payload: {
              ...initialYaml.tasks[0].payload,
              command: this.state.commands,
              image: this.state.image
            }
          }
        }
      ]
    });

    return (
      <div>
        <HelmetTitle title="Quick Start" />
        <hr />
        <CodeEditor mode="yaml" value={newYaml} />
      </div>
    );
  }

  handleInstalledStatus = e => {
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

    return this.state.installedState === 'success' ? (
      <p className="text-success">You are all set!</p>
    ) : (
      <p className="text-danger">
        The integration has not been set up for this repository. Please contact
        the organization owner to have it set up!
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
              This tool lets you easily generate a simple generic{' '}
              <code>.taskcluster.yml</code> file, which should live in the root
              of your repository. It defines tasks that you want Taskcluster to
              run for you. The tasks will run when certain GitHub events happen.
              You will choose the events you are interested in while creating
              the file.
            </p>
            <hr />
            <h5>
              For organization members: Check if your repository already has
              Taskcluster
            </h5>
            <Form onSubmit={this.handleInstalledStatus} inline>
              <FormGroup
                validationState={
                  this.state.installedState === 'loading'
                    ? null
                    : this.state.installedState
                }>
                <FormControl
                  type="text"
                  name="owner"
                  placeholder="Enter organization name"
                  onChange={this.handleSaveTextInput}
                />
                <FormControl.Feedback /> /{' '}
                <FormControl
                  type="text"
                  name="repo"
                  placeholder="Enter repository name"
                  onChange={this.handleSaveTextInput}
                />
                <FormControl.Feedback />
              </FormGroup>{' '}
              <Button type="submit" bsStyle="info">
                <Glyphicon glyph="question-sign" /> Check
              </Button>
              {this.renderInfoText()}
            </Form>
            <hr />
            <h5>
              For independent developers and organization owners: How to set up
              your repository with Taskcluster
            </h5>
            <ul>
              <li>
                Fill out the form below. All changes in the form will instantly
                show up in the code field.
              </li>
              <li>
                When you are done editing, copy the contents of the code field
                and paste it into a file named <code>.taskcluster.yml</code> in
                the root of your repository.
              </li>
              <li>
                Make sure to install the{' '}
                <a
                  href="https://github.com/apps/taskcluster"
                  target="_blank"
                  rel="noopener noreferrer">
                  Taskcluster-GitHub integration
                </a>.
              </li>
            </ul>
            <p>
              Optionally, after you create your file, you can edit it here or in
              you favorite editor to add more functionality. Please refer to the{' '}
              <a
                href="https://docs.taskcluster.net/reference/integrations/github/docs/usage"
                target="_blank"
                rel="noopener noreferrer">
                full documentation on our configuration files
              </a>.
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
                onChange={this.handleSaveTextInput}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Description:</ControlLabel>
              <FormControl
                type="text"
                placeholder="Description of the task"
                name="taskDescription"
                value={this.state.taskDescription}
                onChange={this.handleSaveTextInput}
              />
            </FormGroup>

            <FormGroup>
              <ControlLabel>Who can trigger tasks from PRs</ControlLabel>
              <Radio
                name="allowPullRequests"
                id="prPublic"
                checked={this.state.allowPullRequests === 'public'}
                onChange={this.handleAllowPullRequestsSelection}>
                Public
              </Radio>
              <Radio
                name="allowPullRequests"
                id="prCollaborators"
                checked={this.state.allowPullRequests === 'collaborators'}
                onChange={this.handleAllowPullRequestsSelection}>
                Only Collaborators
              </Radio>
            </FormGroup>

            <FormGroup>
              <ControlLabel>This task should run when:</ControlLabel>
              <Checkbox
                name="pull_request.opened"
                className="data_checkboxes"
                checked={this.state.events.has('pull_request.opened')}
                onChange={this.handleEventsSelection}>
                Pull request opened
              </Checkbox>
              <Checkbox
                name="pull_request.closed"
                className="data_checkboxes"
                checked={this.state.events.has('pull_request.closed')}
                onChange={this.handleEventsSelection}>
                Pull request merged or closed
              </Checkbox>
              <Checkbox
                name="pull_request.synchronize"
                className="data_checkboxes"
                checked={this.state.events.has('pull_request.synchronize')}
                onChange={this.handleEventsSelection}>
                New commit made in an opened pull request
              </Checkbox>
              <Checkbox
                name="pull_request.reopened"
                className="data_checkboxes"
                checked={this.state.events.has('pull_request.reopened')}
                onChange={this.handleEventsSelection}>
                Pull request re-opened
              </Checkbox>
              <Checkbox
                name="push"
                className="data_checkboxes"
                checked={this.state.events.has('push')}
                onChange={this.handleEventsSelection}>
                Push
              </Checkbox>
              <Checkbox
                name="release"
                className="data_checkboxes"
                checked={this.state.events.has('release')}
                onChange={this.handleEventsSelection}>
                Release or tag created
              </Checkbox>
            </FormGroup>

            <FormGroup>
              <ControlLabel>Language your project uses:</ControlLabel>
              <p className={info}>
                <Glyphicon glyph="info-sign" />&nbsp; This will select a
                corresponding docker image.
              </p>
              <FormControl
                componentClass="select"
                name="image"
                onChange={this.handleImageSelection}>
                <option value="node">Node.js</option>
                <option value="python">Python</option>
                <option value="rust:latest">Rust</option>
                <option value="golang">Go</option>
              </FormControl>
            </FormGroup>

            <FormGroup>
              <ControlLabel>Commands: </ControlLabel>
              <FormControl
                componentClass="select"
                placeholder="Pick one..."
                onChange={this.handleCommandsSelection}>
                <option value="standard">Clone repo and run my tests</option>
                <option value="custom">I will define them myself</option>
              </FormControl>
            </FormGroup>
          </Col>
          <Col md={7}>
            <ButtonToolbar>
              <Button
                bsStyle="danger"
                disabled={!this.state.resetActive}
                onClick={this.handleResetAll}>
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
