import React from 'react';
import { Button } from 'react-bootstrap';
import Icon from 'react-fontawesome';
import { string, object, number } from 'prop-types';
import { LazyLog, LazyStream, ScrollFollow } from 'react-lazylog';
import { isNil } from 'ramda';

const buttonStyle = {
  margin: '10px 0 10px 10px'
};

export default class LogView extends React.PureComponent {
  static propTypes = {
    queue: object,
    taskId: string,
    runId: number,
    status: object,
    log: object
  };

  constructor(props) {
    super(props);

    const streaming = this.isStreaming(props.status);

    this.state = {
      streaming,
      follow: streaming
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.status !== this.props.status) {
      const streaming = this.isStreaming(nextProps.status);

      this.setState({
        streaming,
        follow: streaming
      });
    }
  }

  isStreaming(status) {
    return status ?
      status.state === 'pending' || status.state === 'running' :
      false;
  }

  handleFollowClick = () => this.setState({ follow: !this.state.follow });

  handleScroll = ({ scrollTop, scrollHeight, clientHeight }) => {
    if (this.state.follow && scrollHeight - scrollTop !== clientHeight) {
      this.setState({ follow: false });
    }
  };

  render() {
    const { queue, taskId, runId, status, log } = this.props;
    const { streaming, follow } = this.state;

    if (!queue || !taskId || isNil(runId) || !status || !log) {
      return null;
    }

    const url = queue.buildUrl(queue.getArtifact, taskId, runId, log.name);
    const LazyViewer = streaming ? LazyStream : LazyLog;

    return (
      <div>
        <div>
          <Button onClick={this.handleFollowClick} bsSize="sm" style={buttonStyle}>
            <Icon name={follow ? 'check-square-o' : 'square-o'} />
            &nbsp;&nbsp;Follow log
          </Button>

          <Button href={url} target="_blank" rel="noopener noreferrer" bsSize="sm" style={buttonStyle}>
            <Icon name="external-link-square" />&nbsp;&nbsp;View raw log
          </Button>
        </div>

        <ScrollFollow startFollowing={follow}>
          {({ follow }) => (
            <LazyViewer url={url} height={600} follow={follow} onScroll={this.handleScroll} />
          )}
        </ScrollFollow>
      </div>
    );
  }
}
