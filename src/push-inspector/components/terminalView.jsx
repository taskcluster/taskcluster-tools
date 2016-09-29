import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import ansiRegex from 'ansi-regex';
import ansiUp from 'ansi_up';
import Worker from 'worker!../../lib/ui/log-fetcher';

export default class TerminalView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      lines: ['Loading log...'],
      fromBottom: 0
    };

    this.rows = 40;
    this.scrollDown = false;

    this.onData = this.onData.bind(this);
    this.scrollbarHeight = this.scrollbarHeight.bind(this);
    this.scrollbarMargin = this.scrollbarMargin.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  componentWillMount() {
    this.open();
  }

  componentWillUnmount() {
    if (this.worker) {
      this.abortRequest();
    }
  }

  componentDidMount() {
    findDOMNode(this.refs.scrollbar).addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
  }

  abortRequest() {
    if (this.worker) {
      this.worker.postMessage({ abort: true });
      this.worker = null;
    }
  }

  refresh() {
    this.open();
  }

  open() {
    // Abort previous request if any
    if (this.worker) {
      this.abortRequest();
    }

    // If not given a URL we'll just stop here with an empty terminal
    if (!this.props.url) {
      return;
    }

    this.worker = new Worker();
    this.worker.addEventListener('message', this.onData);
    this.worker.postMessage({ url: this.props.url });
  }

  onData(e) {
    const response = e.data;
    const newFromBottom = 0;

    if (response.data) {
      this.setState({
        lines: response.data,
        fromBottom: newFromBottom
      });
    }
  }

  scrollbarHeight() {
    if (!this.refs.buffer) {
      return 0;
    }

    let ratio = this.rows / this.state.lines.length;

    if (ratio > 1) {
      ratio = 1;
    }

    const height = ratio * findDOMNode(this.refs.buffer).offsetHeight;

    return Math.max(height, 10);
  }

  scrollbarMargin() {
    if (!this.refs.buffer) {
      return 0;
    }

    const ratio = (this.state.lines.length - this.state.fromBottom - this.rows) /
      this.state.lines.length;

    return ratio * (findDOMNode(this.refs.buffer).offsetHeight - this.scrollbarHeight());
  }

  scrollbarSet(newState) {
    const fromBottom = Math.min(
      this.state.lines.length - this.rows,
      Math.max(0, Math.floor(newState))
    );

    if (fromBottom !== this.state.fromBottom) {
      this.setState({ fromBottom });
    }
  }

  scrollbarMove(dist) {
    this.scrollbarSet(this.state.fromBottom - dist);
  }

  onMouseWheel(e) {
    e.preventDefault();
    this.scrollbarMove(Math.sign(e.deltaY));
  }

  onMouseMove(e) {
    if (!this.dragging) {
      return;
    }

    const diff = e.pageY - this.startY;
    const space = findDOMNode(this.refs.buffer).offsetHeight;
    const margin = this.margin + diff;
    const currentTop = (margin + this.scrollbarHeight()) / (space * this.state.lines.length);

    this.scrollbarSet(this.state.lines.length - currentTop);
  }

  onMouseDown(e) {
    e.preventDefault();

    if (e.button === 0) {
      this.dragging = true;
      this.startY = e.pageY;
      this.margin = this.scrollbarMargin();
      this.startOffset = this.state.fromBottom;
    }
  }

  onMouseUp(e) {
    if (!e.button) {
      this.dragging = false;
    }
  }

  render() {
    let start = this.state.lines.length - this.state.fromBottom - this.rows;
    let paddingRows = 0;

    if (start < 0) {
      start = 0;
    }

    // Check if the log has less lines than the number of rows
    // or if we are displaying the beginning of the log
    if (this.rows <= this.state.lines.length && this.state.lines[start] !== this.state.lines[0]) {
      paddingRows = 15;
    }

    const frame = this.state.lines.slice(start + paddingRows, start + this.rows + paddingRows);

    return (
      <div className="viewer" onWheel={this.onMouseWheel}>
        <div className="buffer" ref="buffer">
          {
            frame.map(line => {
              // Check if there are any ansi colors/styles
              if (ansiRegex().test(line)) {
                const newLine = ansiUp.ansi_to_html(line);
                return <div key={start++} dangerouslySetInnerHTML={{ __html: newLine }}></div>;
              }

              return <div key={start++}>{line}</div>;
            })
          }
        </div>
        <div
          className="scrollbar"
          style={{ height: this.scrollbarHeight(), marginTop: this.scrollbarMargin() }}
          ref="scrollbar" />
      </div>
    );
  }
}
