let React         = require('react');
let debug         = require('debug')('lib:utils');
let assert        = require('assert');
let markdown      = require('markdown-it');
let bs            = require('react-bootstrap');
let moment        = require('moment');
let hljs          = require('highlight.js');
let slugid        = require('slugid');


/**
 * Awesome Font Icon
 *
 * Derived from github.com/andreypopp/react-fa by Andrey Popp.
 */
var Icon = React.createClass({
  propTypes: {
    name:       React.PropTypes.string.isRequired,
    size:       React.PropTypes.oneOf(['lg', '2x', '3x', '4x', '5x']),
    rotate:     React.PropTypes.oneOf(['90', '180', '270']),
    flip:       React.PropTypes.oneOf(['horizontal', 'vertical']),
    fixedWidth: React.PropTypes.bool,
    spin:       React.PropTypes.bool
  },

  render() {
    var {
      name, size, rotate, flip, spin, fixedWidth,
      className, ...props
    } = this.props;
    var classNames = `fa fa-${name}`;
    if (size) {
      classNames += ` fa-${size}`;
    }
    if (rotate) {
      classNames += ` fa-rotate-${rotate}`;
    }
    if (flip) {
      classNames += ` fa-flip-${flip}`;
    }
    if (fixedWidth) {
      classNames += ' fa-fw';
    }
    if (spin) {
      classNames += ' fa-spin';
    }
    if (className) {
      classNames += ` ${className}`;
    }
    return <span {...props} className={classNames} />;
  }
});

// Export Icon
exports.Icon = Icon;

/** Render Markdown and handle all the particularities */
var Markdown = React.createClass({
  propTypes: {
    children:   React.PropTypes.string
  },

  /** Render Markdown */
  render() {
    const html = markdown().render(this.props.children || '');

    return (
      <span
        className="markdown-view"
        dangerouslySetInnerHTML={{__html: html}} />
    );
  }
});

// Export Markdown
exports.Markdown = Markdown;


/** Display a date object with optional since property */
var DateView = React.createClass({
  /** Validate properties */
  propTypes: {
    date:       React.PropTypes.oneOfType([
                  React.PropTypes.instanceOf(Date),
                  React.PropTypes.string
                ]).isRequired,
    since:      React.PropTypes.oneOfType([
                  React.PropTypes.instanceOf(Date),
                  React.PropTypes.string
                ]),
    placement:  React.PropTypes.oneOf([
                  'left', 'top', 'right', 'bottom'
                ]),
    format:     React.PropTypes.string
  },

  /** default properties */
  getDefaultProps() {
    return {
      format:     'Do of MMMM YYYY, H:mm:ss',
      placement:  'top'
    };
  },

  /** Render DateView */
  render() {
    this._id = this._id || slugid.v4();

    // Create since object if
    var since;
    if (this.props.since) {
      since = moment(this.props.date).from(this.props.since, true);
      since = "(" + since + " later)";
    }

    return (
      <bs.OverlayTrigger placement={this.props.placement}
                         overlay={this.renderTooltip()}>
        <span id={this._id}>
          {moment(this.props.date).fromNow()}&nbsp;{since}
        </span>
      </bs.OverlayTrigger>
    );
  },

  /** Render tooltip */
  renderTooltip() {
    return (
      <bs.Tooltip id={this._id}>
        {moment(this.props.date).format(this.props.format)}
      </bs.Tooltip>
    );
  }
});

// Export DateView
exports.DateView = DateView;


/** Highlight code */
var Code = React.createClass({
  // Validate properties
  propTypes: {
    children:   React.PropTypes.string.isRequired,
    language:   (props, propName) => {
      var language = props[propName];
      if (!hljs.getLanguage(language)) {
        return new Error("Language '" + language + "' not supported " +
                         "by highlight.js");
      }
    }
  },

  // Render code
  render() {
    var code = hljs.highlight(this.props.language, this.props.children, true);
    /*var html = Prism.highlight(
      this.props.children,
      Prism.languages[this.props.language],
      this.props.language
    );*/
    return (
      <pre className={'language-' + this.props.language}>
        <code dangerouslySetInnerHTML={{__html: code.value}}></code>
      </pre>
    );
  }
});

// Export Code
exports.Code = Code;


/** Simple collapsible section */
var Collapse = React.createClass({
  propTypes: {
    title:            React.PropTypes.node.isRequired,
    children:         React.PropTypes.node.isRequired,
    initialExpanded:  React.PropTypes.bool,
  },

  getDefaultProps() {
    return {
      initialExpanded: false,
    };
  },

  getInitialState() {
    return {
      expanded: this.props.initialExpanded,
    };
  },

  render() {
    return (
      <div>
        <span onClick={this.toggle}>{this.props.title}</span>
        {
          this.state.expanded ?
            <div>{this.props.children}</div>
          :
            ''
        }
      </div>
    );
  },

  toggle() {
    this.setState({expanded: !this.state.expanded});
  },
});

exports.Collapse = Collapse;