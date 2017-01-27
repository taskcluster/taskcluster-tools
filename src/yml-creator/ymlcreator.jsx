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

export default class YmlCreator extends React.Component {
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
              the <a href="https://docs.taskcluster.net">full documentation on our configuration files</a>.
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
                value=""
                ref="rootName"
                onChange="" />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Description:</ControlLabel>
              <FormControl
                type="text"
                placeholder="Description"
                value=""
                ref="rootDescription"
                onChange="" />
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
                value=""
                ref="taskName"
                onChange="" />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Description:</ControlLabel>
              <FormControl
                type="text"
                placeholder="Description of the task"
                value=""
                ref="taskDescription"
                onChange="" />
            </FormGroup>
          </Col>
          <Col md={7}>
            <FormGroup>
              <ControlLabel>Events:</ControlLabel>
              <Checkbox>Pull request opened</Checkbox>
              <Checkbox>Pull request merged or closed</Checkbox>
              <Checkbox>Push</Checkbox>
              <Checkbox>Release or tag created</Checkbox>
            </FormGroup>
            <FormGroup>
              <ControlLabel>Language:</ControlLabel>
              <FormControl componentClass="select" placeholder="Pick one...">
                <option value="node">JavaScript with Node.js</option>
                <option value="python">Python</option>
              </FormControl>
            </FormGroup>
            <FormGroup>
              <ControlLabel>Commands: </ControlLabel>
              <FormControl componentClass="select" placeholder="Pick one...">
                <option value="standard">Clone repo and run my tests</option>
                <option value="custom">I need something fussier</option>
              </FormControl>
            </FormGroup>
          </Col>
        </Row>

        <hr />

        <ButtonToolbar>
          <Button
            bsStyle="success">
            <Glyphicon glyph="plus" /> Define another task
          </Button>
          <Button
            bsStyle="primary">
            <Glyphicon glyph="ok" /> Create file
          </Button>
        </ButtonToolbar>
      </Grid>
    );
  }
}
