var React           = require('react');
var Terminal        = require('term.js/src/term');
var utils           = require('../utils');


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
      options: {
        cols:         120,
        rows:         40,
        cursorBlink:  true,
        visualBell:   false,
        popOnBell:    false,
        screenKeys:   false,
        scrollback:   50000,
        debug:        false,
        useStyle:     true
      }
    };
  },

  propTypes: {
    url:      React.PropTypes.string,
    options:  React.PropTypes.object.isRequired
  },

  // Refresh the currently displayed file
  refresh: function() {
    this.open();
  },

  /** Open a URL in the terminal */
  open: function() {
    // Destroy existing terminal if there is one
    if (this.term) {
      this.term.destroy();
      this.term = null;
    }
    // Abort previous request if any
    if (this.request) {
      this.abortRequest();
    }

    // Create new terminal
    this.term = new Terminal(this.props.options);
    this.term.open(this.refs.term.getDOMNode());
    // term.js does a setTimeout() then calls element.focus()
    // This is truly annoying. To avoid it we could remove the tabindex property
    // but then we can copy out text.
    //   this.term.element.removeAttribute('tabindex');
    // So the solution is to be naughty and monkey patch the element, we'll then
    // restore it to it's former glory when it is called the first time.
    // This is super ugly and fragile, but it works...
    var focusMethod = this.term.element.focus;
    var element     = this.term.element;
    element.focus = function() {
      element.focus = focusMethod;
    };

    // If not given a URL we'll just stop here with an empty terminal
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

  onData: function() {
    // Write data to term if there is any data
    if (this.request.responseText !== null ||
        this.request.responseText !== undefined) {
      // Check if we have new data
      var length = this.request.responseText.length;
      if (length > this.dataOffset) {
        // Find new data
        var data = this.request.responseText.slice(this.dataOffset, length);
        // Update dataOffset
        this.dataOffset = length;
        // Write to term
        this.term.write(data);
      }
    }
    // When request is done
    if (this.request.readyState === this.request.DONE) {
      // Stop cursor from blinking
      this.term.cursorBlink = false;
      if (this.term._blink) {
        clearInterval(this.term._blink);
      }
      this.term.showCursor();

      // Write an error, if request failed
      if (this.request.status !== 200) {
        this.term.write("\r\n[task-inspector] Failed to fetch log!\r\n");
      }
    }
  },

  abortRequest: function() {
    this.request.removeEventListener('progress', this.onData);
    this.request.removeEventListener('load', this.onData);
    this.request.abort();
    this.request = null;
  },

  componentWillUnmount: function() {
    if (this.request) {
      this.abortRequest();
    }
    this.term.destroy();
    this.term = null;
  },

  render: function() {
    return <div className="terminal-view" ref="term"></div>;
  }
});

// Export TerminalView
module.exports = TerminalView;
