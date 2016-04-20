var React           = require('react');
var utils           = require('../utils');
var log_fetcher     = require('./log-fetcher.js');

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

    getDefaultProps(){
        return {
            url:            undefined,  // No URL to display at this point
            cols: 90,
            rows: 40,
            scrollDown: false,
        };
    },

    getInitialState(){
        return {
            lines: ['one', 'two', 'three', 'testing...'],
            fromBottom: 0,
        };
    },

    propTypes: {
        url:      React.PropTypes.string,
    },

    // Refresh the currently displayed file
    refresh(){
        this.open();
    },

    /** Open a URL in the terminal */
    open(){
        // Abort previous request if any
        if (this.request){
            this.abortRequest();
        }

        // If not given a URL we'll just stop here with an empty terminal
        if (!this.props.url){
            return;
        }

        // Open a new request
        this.dataOffset = 0;
        this.worker = new Worker(log_fetcher);
        this.worker.addEventListener('message', this.onData);
        this.worker.postMessage({url: this.props.url, cols: this.props.cols});
    },

    /* Communicate with the worker */
    onData(e){
        var response = e.data;

        // Write data to term if there is any data
        if (response.data){
            var newFromBottom = this.state.fromBottom;
            if(!this.props.scrollDown){
                // we don't expect the data to get shrunk
                // since it's a log, it can only grow
                newFromBottom += response.data.length - this.state.lines.length;
            }
            this.setState({
                lines : response.data,
                fromBottom: newFromBottom,
            });
        }
    },

    abortRequest(){
        if(this.worker){
            this.worker.postMessage({abort: true});
            this.worker = null;
        }
    },

    componentWillUnmount(){
        if (this.worker){
            this.abortRequest();
        }
    },

    /* Some methods to work with the scrollbar. * 
     * Maybe should become a separate class?    */
    scrollbarHeight(){
        if(!this.refs.buffer) return 0;
        var ratio = this.props.rows / this.state.lines.length;
        if(ratio > 1) ratio = 1;
        var height = ratio * this.refs.buffer.offsetHeight;
        return Math.max(height, 10);
    },

    scrollbarMargin(){
        if(!this.refs.buffer) return 0;
        var ratio = (this.state.lines.length - this.state.fromBottom - this.props.rows)
                    / this.state.lines.length;
        return ratio * (this.refs.buffer.offsetHeight - this.scrollbarHeight());
    },

    scrollbarSet(newState){
        newState = Math.floor(newState);
        newState = Math.max(0, newState);
        newState = Math.min(this.state.lines.length - this.props.rows, newState);
        if(newState != this.state.fromBottom)
            this.setState({fromBottom: newState});
    },

    scrollbarMove(dist){
        this.scrollbarSet(this.state.fromBottom - dist);
    },

    onMouseWheel(e){
        e.preventDefault();
        this.scrollbarMove(Math.sign(e.deltaY));
    },

    onMouseMove(e){
        if(this.dragging){
            var diff = e.pageY - this.startY;
            var space = this.refs.buffer.offsetHeight;
            var margin = this.margin + diff;
            var currentTop = (margin + this.scrollbarHeight()) / space * this.state.lines.length;
            this.scrollbarSet(this.state.lines.length - currentTop);
        }
    },

    onMouseDown(e){
        e.preventDefault();
        if(e.button == 0){
            this.dragging = true;
            this.startY = e.pageY;
            this.margin = this.scrollbarMargin();
            this.startOffset = this.state.fromBottom;
        }
    },

    onMouseUp(e){
        if(e.button == 0)
            this.dragging = false;
    },

    componentDidMount(){
        this.refs.scrollbar.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('mousemove', this.onMouseMove);
    },

    render(){
        var start = this.state.lines.length - this.state.fromBottom - this.props.rows;
        if(start < 0) start = 0;
        var frame = this.state.lines.slice(start, start + this.props.rows);
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

// Export TerminalView
module.exports = TerminalView;
