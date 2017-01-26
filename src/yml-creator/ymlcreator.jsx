import React from 'react';
import {Grid, Row, Col} from 'react-bootstrap';

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
              creating the file. After pressing <b>Create</b> button, you will see the contents of 
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
          <Col sm={12}>
            <FormGroup>
              <h5>Enter the name and desciption of your project or these tasks:</h5>
            </FormGroup>
          </Col>
        <Row>
        </Row>
      </Grid>
    );
  }
}
