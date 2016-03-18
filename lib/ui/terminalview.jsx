var React           = require('react');
var utils           = require('../utils');
var log_fetcher     = require('./log-fetcher.js');

var Viewer = React.createClass({
    getDefaultProps: function(){
        return {
            cols: 120,
            rows: 20,
        };
    },

    getInitialState: function(){
        return {
            fromBottom: 0
        };
    },

    scrollbarHeight: function(){
        if(!this.refs.buffer) return 0;
        var ratio = this.props.rows / this.props.lines.length;
        if(ratio > 1) ratio = 1;
        var height = ratio * this.refs.buffer.offsetHeight;
        return Math.max(height, 10);
    },

    scrollbarMargin: function(){
        if(!this.refs.buffer) return 0;
        var ratio = (this.props.lines.length - this.state.fromBottom - this.props.rows)
                    / this.props.lines.length;
        return ratio * (this.refs.buffer.offsetHeight - this.scrollbarHeight());
    },

    scrollbarSet: function(newState){
        newState = Math.floor(newState);
        newState = Math.max(0, newState);
        newState = Math.min(this.props.lines.length - this.props.rows, newState);
        if(newState != this.state.fromBottom)
            this.setState({fromBottom: newState});
    },

    scrollbarMove: function(dist){
        this.scrollbarSet(this.state.fromBottom - dist);
    },

    onMouseWheel: function(e){
        e.preventDefault();
        this.scrollbarMove(Math.sign(e.deltaY));
    },

    onMouseMove: function(e){
        if(this.dragging){
            var diff = e.pageY - this.startY;
            var space = this.refs.buffer.offsetHeight;
            var margin = this.margin + diff;
            var currentTop = (margin + this.scrollbarHeight()) / space * this.props.lines.length;
            this.scrollbarSet(this.props.lines.length - currentTop);
        }
    },

    onMouseDown: function(e){
        e.preventDefault();
        if(e.button == 0){
            this.dragging = true;
            this.startY = e.pageY;
            this.margin = this.scrollbarMargin();
            this.startOffset = this.state.fromBottom;
        }
    },

    onMouseUp: function(e){
        if(e.button == 0)
            this.dragging = false;
    },

    componentDidMount: function(){
        this.refs.scrollbar.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('mousemove', this.onMouseMove);
    },

    render: function(){
        var start = this.props.lines.length - this.state.fromBottom - this.props.rows;
        if(start < 0) start = 0;
        var frame = this.props.lines.slice(start, start + this.props.rows);
        var left = this.props.rows - frame.length; // number of padding divs
        while(left--) frame.push('');
        return <div className="viewer" onWheel={this.onMouseWheel}>
            <div className="buffer" ref="buffer">
            {
                frame.map(function(line){
                    return <div key={start++}>{line}</div>;
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

  getDefaultProps: function() {
    return {
      url:            undefined,  // No URL to display at this point
      cols: 90,
      rows: 40
    };
  },

  getInitialState: function(){
    return {
      lines: ['one', 'two', 'three', 'testing...']
    };
  },

  propTypes: {
    url:      React.PropTypes.string,
  },

  // Refresh the currently displayed file
  refresh: function() {
    this.open();
  },

  /** Open a URL in the terminal */
  open: function() {
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
    this.worker = new Worker(log_fetcher);
    this.worker.addEventListener('message', this.onData);
    this.worker.postMessage({url: this.props.url, cols: this.props.cols});
  },

  onData: function(e) {
    var response = e.data;

    // Write data to term if there is any data
    if (response.data)
        this.setState({lines : response.data});
  },

  abortRequest: function() {
    if(this.worker){
        this.worker.postMessage({abort: true});
        this.worker = null;
    }
  },

  componentWillUnmount: function() {
    if (this.worker) {
      this.abortRequest();
    }
  },

  render: function() {
    return <Viewer rows={this.props.rows} cols={this.props.cols}
                   lines={this.state.lines}/>;
  }
});

// Export TerminalView
module.exports = TerminalView;
