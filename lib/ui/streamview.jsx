var React           = require('react');
var CodeMirror      = require('react-code-mirror');
var utils           = require('../utils');
var stripAnsi       = require('strip-ansi');
var workerstream    = require('workerstream');

//window.w = new Worker('./ansi');

// TODO: Take a good long look at: ansi-html-stream

var StreamView = React.createClass({
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
    };
  },

  propTypes: {
    url:      React.PropTypes.string,
  },

  // Refresh the currently displayed file
  refresh() {
    this.open();
  },

  getInitialState() {
    return {
      data: ''
    };
  },

  /** Open a URL in the view */
  open() {
    // Clear view
    if (this.refs.view) {
      this.refs.view.getDOMNode().text = '';
    }

    // Abort previous request if any
    if (this.request) {
      this.abortRequest();
    }

    // If not given a URL we'll just stop here with an empty view
    if (!this.props.url) {
      return;
    }

    // Open a new request
    this.dataOffset = 0;
    this.request = new XMLHttpRequest();
    this.request.open('get', this.props.url, true);
    this.request.addEventListener('progress', this.onData);
    this.request.addEventListener('load', this.onData);
    this.request.send();
  },

  onData() {
    window.requestAnimationFrame(() => {
      // Write data to term if there is any data
      if (this.request.responseText !== null ||
          this.request.responseText !== undefined) {
        // Check if we have new data
        var length = this.request.responseText.length;
        if (length > this.dataOffset) {
          // Update dataOffset
          this.dataOffset = length;
          // Write to term
          this.setState({
            data: this.request.responseText.replace(/\r/g,'')
          });
        }
      }
      // When request is done
      if (this.request.readyState === this.request.DONE) {
        this.setState({
          data: this.request.responseText.replace(/\r/g,'')
        });
        // Write an error, if request failed
        if (this.request.status !== 200) {
          //this.refs.view.getDOMNode().text +=
          //  "\r\n[task-inspector] Failed to fetch log!\r\n";
        }
      }
    });
  },

  abortRequest() {
    this.request.removeEventListener('progress', this.onData);
    this.request.removeEventListener('load', this.onData);
    this.request.abort();
    this.request = null;
  },

  componentWillUnmount() {
    if (this.request) {
      this.abortRequest();
    }
    this.term.destroy();
    this.term = null;
  },

  render() {
    return (
      <CodeMirror
        ref="view"
        value={this.state.data}
        readOnly={true}
        lineWrapping={false}
        textAreaStyle={{minHeight: '50ex'}}/>
    );
  }

});

// Export StreamView
module.exports = StreamView;
