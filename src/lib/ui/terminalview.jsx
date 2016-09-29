import React from 'react';
import { findDOMNode } from 'react-dom';
import * as utils from '../utils';
import ansiUp from 'ansi_up';
import ansiRegex from 'ansi-regex';
import Worker from 'worker!./log-fetcher';
import './terminalview.less';

/** Display terminal output */
export default React.createClass({
  displayName: 'TerminalView',

  mixins: [
    // Call this.open() when props.url changes
    utils.createWatchStateMixin({
      onProps: {
        open: ['url']
      }
    })
  ],

  getDefaultProps() {
    return {
      url: null,  // No URL to display at this point
      rows: 32,
      scrollDown: false
    };
  },

  getInitialState() {
    return {
      lines: ['Loading log...'],
      fromBottom: 0
    };
  },

  propTypes: {
    url: React.PropTypes.string
  },

  // Refresh the currently displayed file
  refresh() {
    this.open();
  },

  /** Open a URL in the terminal */
  open() {
    // Abort previous request if any
    if (this.request) {
      this.abortRequest();
    }

    // If not given a URL we'll just stop here with an empty terminal
    if (!this.props.url) {
      return;
    }

    // Open a new request
    this.dataOffset = 0;
    this.worker = new Worker();
    this.worker.addEventListener('message', this.onData);
    this.worker.postMessage({ url: this.props.url });
  },

  /* Communicate with the worker */
  onData(e) {
    const response = e.data;

    // Write data to term if there is any data
    if (response.data) {
      let newFromBottom = 0;

      if (!this.props.scrollDown) {
        // we don't expect the data to get shrunk
        // since it's a log, it can only grow
        newFromBottom += response.data.length - this.state.lines.length;
      }

      this.setState({
        lines: response.data,
        fromBottom: newFromBottom
      });
    }
  },

  abortRequest() {
    if (this.worker) {
      this.worker.postMessage({ abort: true });
      this.worker = null;
    }
  },

  componentWillUnmount() {
    if (this.worker) {
      this.abortRequest();
    }
  },

  /* Some methods to work with the scrollbar. *
   * Maybe should become a separate class?    */
  scrollbarHeight() {
    if (!this.refs.buffer) {
      return 0;
    }

    let ratio = this.props.rows / this.state.lines.length;

    if (ratio > 1) {
      ratio = 1;
    }

    const height = ratio * findDOMNode(this.refs.buffer).offsetHeight;

    return Math.max(height, 10);
  },

  scrollbarMargin() {
    if (!this.refs.buffer) {
      return 0;
    }

    const ratio = (this.state.lines.length - this.state.fromBottom - this.props.rows) /
      this.state.lines.length;

    return ratio * (findDOMNode(this.refs.buffer).offsetHeight - this.scrollbarHeight());
  },

  scrollbarSet(newState) {
    const fromBottom = Math.min(
      this.state.lines.length - this.props.rows,
      Math.max(0, Math.floor(newState))
    );

    if (fromBottom !== this.state.fromBottom) {
      this.setState({ fromBottom });
    }
  },

  scrollbarMove(dist) {
    this.scrollbarSet(this.state.fromBottom - dist);
  },

  onMouseWheel(e) {
    e.preventDefault();
    this.scrollbarMove(Math.sign(e.deltaY));
  },

  onMouseMove(e) {
    if (!this.dragging) {
      return;
    }

    const diff = e.pageY - this.startY;
    const space = findDOMNode(this.refs.buffer).offsetHeight;
    const margin = this.margin + diff;
    const currentTop = (margin + this.scrollbarHeight()) / (space * this.state.lines.length);

    this.scrollbarSet(this.state.lines.length - currentTop);
  },

  onMouseDown(e) {
    e.preventDefault();

    if (!e.button) {
      return;
    }

    this.dragging = true;
    this.startY = e.pageY;
    this.margin = this.scrollbarMargin();
    this.startOffset = this.state.fromBottom;
  },

  onMouseUp(e) {
    if (!e.button) {
      this.dragging = false;
    }
  },

  componentDidMount() {
    this.refs.scrollbar.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
  },

  render() {
    let start = this.state.lines.length - this.state.fromBottom - this.props.rows;

    if (start < 0) {
      start = 0;
    }

    const frame = this.state.lines.slice(start, start + this.props.rows);

    return (
      <div className="viewer" onWheel={this.onMouseWheel}>
        <div className="buffer" ref="buffer">
          {frame.map(line => {
            // Check if there are any ansi colors/styles
            const doubleSpace = line.match(/ {2}/g);

            if (ansiRegex().test(line)) {
              const newLine = ansiUp.ansi_to_html(line);

              return doubleSpace && doubleSpace.length ? (
                  <div
                    className="pre-white"
                    key={start++}
                    dangerouslySetInnerHTML={{ __html: newLine }} />
                ) :
                <div key={start++} dangerouslySetInnerHTML={{ __html: newLine }} />;
            } else if (doubleSpace && doubleSpace.length) {
              return <div className="pre-white" key={start++}>{line}</div>;
            }

            return <div key={start++}>{line}</div>;
          })}
        </div>
        <div className="scrollbar" style={{
          height: this.scrollbarHeight(),
          marginTop: this.scrollbarMargin()
        }} ref="scrollbar"/>
      </div>
    );
  }
});
