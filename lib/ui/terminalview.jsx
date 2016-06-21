var React           = require('react');
var utils           = require('../utils');
var ansi_up         = require('ansi_up');
var work            = require('webworkify');
var ansiRegex       = require('ansi-regex');
 

/** Display terminal output */
var TerminalView = React.createClass({
  mixins: [
    // Call this.open() when props.url changes
    utils.createWatchStateMixin({
      onProps: {
        open:                     ['url']
      }
    })
  ],

  getDefaultProps() {
    return {
      url:            undefined,  // No URL to display at this point
      rows: 40,
      scrollDown: false,
    };
  },

  getInitialState() {
    return {
      lines: ['Loading log...'],
      fromBottom: 0,
    };
  },

  propTypes: {
    url:      React.PropTypes.string,
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
    this.worker = work(require('./log-fetcher.js'));
    this.worker.addEventListener('message', this.onData);
    this.worker.postMessage({ url: this.props.url });
  },

  /* Communicate with the worker */
  onData(e) {
    var response = e.data;
    // Write data to term if there is any data
    if (response.data) {
      var newFromBottom = 0;
      if (!this.props.scrollDown) {
        // we don't expect the data to get shrunk
        // since it's a log, it can only grow
        newFromBottom += response.data.length - this.state.lines.length;
      }
      this.setState({
        lines: response.data,
        fromBottom: newFromBottom,
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
    var ratio = this.props.rows / this.state.lines.length;
    if (ratio > 1) {
      ratio = 1;
    } 
    var height = ratio * this.refs.buffer.offsetHeight;
    return Math.max(height, 10);
  },

  scrollbarMargin() {
    if (!this.refs.buffer) {
      return 0;
    }
    var ratio = (this.state.lines.length - this.state.fromBottom - this.props.rows) / this.state.lines.length;
    return ratio * (this.refs.buffer.offsetHeight - this.scrollbarHeight());
  },

  scrollbarSet(newState) {
    newState = Math.floor(newState);
    newState = Math.max(0, newState);
    newState = Math.min(this.state.lines.length - this.props.rows, newState);
    if (newState != this.state.fromBottom) {
      this.setState({ fromBottom: newState });
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
    if (this.dragging) {
      var diff = e.pageY - this.startY;
      var space = this.refs.buffer.offsetHeight;
      var margin = this.margin + diff;
      var currentTop = (margin + this.scrollbarHeight()) / space * this.state.lines.length;
      this.scrollbarSet(this.state.lines.length - currentTop);
    }
  },

  onMouseDown(e) {
    e.preventDefault();
    if (e.button == 0) {
      this.dragging = true;
      this.startY = e.pageY;
      this.margin = this.scrollbarMargin();
      this.startOffset = this.state.fromBottom;
    }
  },

  onMouseUp(e) {
    if (e.button == 0) {
      this.dragging = false;
    }
  },

  componentDidMount() {
    this.refs.scrollbar.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
  },

  render() {
    var start = this.state.lines.length - this.state.fromBottom - this.props.rows;
    if (start < 0) {
      start = 0;
    }
    var paddingRows = 0;
    //Check if the log has less lines than the number of rows or if we are displaying the beggining of the log
    if (this.props.rows <= this.state.lines.length && this.state.lines[start] !== this.state.lines[0]) {
      paddingRows = 15;
    }
    var frame = this.state.lines.slice(start + paddingRows, start + this.props.rows + paddingRows);
    return <div className="viewer" onWheel={this.onMouseWheel}>
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
        })
      }
      </div>
      <div className="scrollbar" style={{
        height: this.scrollbarHeight(),
        marginTop: this.scrollbarMargin()
        }} ref="scrollbar"/>
      </div>;
  }
});

// Export TerminalView
module.exports = TerminalView;
