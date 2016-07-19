import React, { Component } from 'react';
import * as bs from 'react-bootstrap';
import work from 'webworkify';
import ansiRegex from 'ansi-regex';
import _ from 'lodash';

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
    this.refs.scrollbar.addEventListener('mousedown', this.onMouseDown);
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

    this.worker = work(require('../../lib/ui/log-fetcher.js'));
    this.worker.addEventListener('message', this.onData);
    this.worker.postMessage({ url: this.props.url });
  }

  onData(e) { 
    const response = e.data;
    const newFromBottom = 0;
    
    if(response.data) {
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
    let height = ratio * this.refs.buffer.offsetHeight;

    if (ratio > 1) {
      ratio = 1;
    } 

    return Math.max(height, 10);
  }

  scrollbarMargin() {
    if (!this.refs.buffer) {
      return 0;
    }
    let ratio = (this.state.lines.length - this.state.fromBottom - this.rows) / this.state.lines.length;

    return ratio * (this.refs.buffer.offsetHeight - this.scrollbarHeight());
  }

  scrollbarSet(newState) {
    newState = Math.floor(newState);
    newState = Math.max(0, newState);
    newState = Math.min(this.state.lines.length - this.rows, newState);
    
    if (newState !== this.state.fromBottom) {
      this.setState({ fromBottom: newState });
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
    if (this.dragging) {
      let diff = e.pageY - this.startY;
      let space = this.refs.buffer.offsetHeight;
      let margin = this.margin + diff;
      let currentTop = (margin + this.scrollbarHeight()) / space * this.state.lines.length;

      this.scrollbarSet(this.state.lines.length - currentTop);
    }
  }

  onMouseDown(e) {
    e.preventDefault();
    if (e.button == 0) {
      this.dragging = true;
      this.startY = e.pageY;
      this.margin = this.scrollbarMargin();
      this.startOffset = this.state.fromBottom;
    }
  }

  onMouseUp(e) {
    if (e.button == 0) {
      this.dragging = false;
    }
  }

  render() {
    const { state }  = this;
    let start = this.state.lines.length - this.state.fromBottom - this.rows;
    let paddingRows = 0;

    if (start < 0) {
      start = 0;
    }

    //Check if the log has less lines than the number of rows or if we are displaying the beggining of the log
    if (this.rows <= this.state.lines.length && this.state.lines[start] !== this.state.lines[0]) {
      paddingRows = 15;
    }

    let frame = this.state.lines.slice(start + paddingRows, start + this.rows + paddingRows);

    return (
      <div className="viewer" onWheel={this.onMouseWheel}>
        <div className="buffer" ref="buffer">
          {
            frame.map(function(line) {
              // Check if there are any ansi colors/styles
              if (ansiRegex().test(line)) {
                var new_line = ansi_up.ansi_to_html(line);
                return <div key={start++} dangerouslySetInnerHTML={{__html: new_line}}></div>;
              } else {
                return <div key={start++}>{(line)}</div>;
              };
            });
          }
        </div>
        <div className="scrollbar" 
          style={{ height: this.scrollbarHeight(), marginTop: this.scrollbarMargin() }} 
          ref="scrollbar"/>
      </div>
    );
  }
}
