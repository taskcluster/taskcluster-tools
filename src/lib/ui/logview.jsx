import React, { Component } from 'react';
import { Row, Col, Form, FormGroup, FormControl, Glyphicon, Button } from 'react-bootstrap';
import taskcluster from 'taskcluster-client';
import { TaskClusterEnhance } from '../utils';

/** Render a terminal and a dropdown menu to select logs from */
class LogView extends Component {
  constructor(props) {
    super(props);

    const entry = this.props.logs.find(log =>
        log.name === 'public/logs/terminal.log' ||
        log.name === 'public/logs/live.log'
      ) || this.props.logs[0];

    this.state = { name: entry ? entry.name : '' };

    this.refreshLog = this.refreshLog.bind(this);
    this.handleLogChanged = this.handleLogChanged.bind(this);
  }

  refreshLog() {
    this.refs.logFrame.src = this.refs.logFrame.src;
  }

  render() {
    if (!this.state.name) {
      return <div>No logs found for the selected run.</div>;
    }

    const logUrl = this.props.clients.queue.buildUrl(
      this.props.clients.queue.getArtifact,
      this.props.taskId,
      this.props.runId,
      this.state.name
    );

    const src = `https://taskcluster.github.io/unified-logviewer/?url=${logUrl}&jumpToHighlight=true`;

    return (
      <Row>
        <Col sm={12}>
          <Form inline={true}>
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
            <a href={src} target="_blank" rel="noopener noreferrer" className="btn btn-default btn-sm">
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
  }

  handleLogChanged(e) {
    this.setState({ name: e.target.value });
  }
}

LogView.propTypes = {
  logs: React.PropTypes.array.isRequired,
  taskId: React.PropTypes.string.isRequired,
  runId: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.number
  ]).isRequired
};

const taskclusterOpts = {
  // Need updated clients for Queue
  clients: { queue: taskcluster.Queue },
  name: LogView.name
};

export default TaskClusterEnhance(LogView, taskclusterOpts);
