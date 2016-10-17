import React from 'react';
import { Row, Col, Form, FormGroup, FormControl, Glyphicon, Button } from 'react-bootstrap';
import taskcluster from 'taskcluster-client';
import { createTaskClusterMixin } from '../utils';

/** Render a terminal and a dropdown menu to select logs from */
export default React.createClass({
  displayName: 'LogView',

  mixins: [
    createTaskClusterMixin({
      // Need updated clients for Queue
      clients: {
        queue: taskcluster.Queue
      }
    })
  ],

  // Get initial state
  getInitialState() {
    const entry = this.props.logs.find(log =>
      log.name === 'public/logs/terminal.log' ||
      log.name === 'public/logs/live.log'
    ) || this.props.logs[0];

    return {
      name: entry ? entry.name : ''
    };
  },

  // Validate properties
  propTypes: {
    logs: React.PropTypes.array.isRequired,
    taskId: React.PropTypes.string.isRequired,
    runId: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number
    ]).isRequired
  },

  refreshLog() {
    this.refs.logFrame.src = this.refs.logFrame.src;
  },

  render() {
    if (!this.state.name) {
      return <div>No logs found for the selected run.</div>;
    }

    const logUrl = this.queue.buildUrl(
      this.queue.getArtifact,
      this.props.taskId,
      this.props.runId,
      this.state.name
    );
    const src =
      `https://taskcluster.github.io/unified-logviewer/?url=${logUrl}&jumpToHighlight=true`;

    return (
      <Row>
        <Col sm={12}>
          <Form inline>
            <FormGroup style={{ marginRight: 10 }}>
              <FormControl
                componentClass="select"
                value={this.state.name}
                onChange={this.handleLogChanged}>
                  {this.props.logs.map((log, key) => (
                    <option value={log.name} key={key}>{log.name}</option>
                  ))}
              </FormControl>
            </FormGroup>

            <Button bsSize="sm" onClick={this.refreshLog} style={{ marginRight: 10 }}>
              <Glyphicon glyph="refresh" /> Refresh
            </Button>
            <a href={src} target="_blank" className="btn btn-default btn-sm">
              <Glyphicon glyph="new-window" /> Open in new window
            </a>
          </Form>
        </Col>

        <Col sm={12} style={{ marginTop: 20 }}>
          <iframe
            ref="logFrame"
            height="500"
            width="100%"
            frameBorder="0"
            src={src} />
        </Col>
      </Row>
    );
  },

  handleLogChanged(e) {
    this.setState({ name: e.target.value });
  }
});
