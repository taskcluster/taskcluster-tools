/** @jsx React.DOM */
var React         = require('react');
var debug         = require('debug')('lib:utils');
var assert        = require('assert');
var marked        = require('marked');
var bs            = require('react-bootstrap');
var moment        = require('moment');

/** Render Markdown and handle all the particularities */
var Markdown = React.createClass({
  /** Validate properties */
  propTypes: {
    children:   React.PropTypes.string,
    safe:       React.PropTypes.bool,
    gfm:        React.PropTypes.bool
  },

  /** Get default properties */
  getDefaultProperties: function() {
    return {
      safe:     true,
      gfm:      true,
      children: ''
    };
  },

  /** Render Markdown */
  render: function() {
    var html = marked(this.props.children || '', {
      sanitize:     this.props.safe,
      gfm:          this.props.gfm
    });
    return <span className="markdown-view"
                 dangerouslySetInnerHTML={{__html: html}}></span>
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
  getDefaultProps: function() {
    return {
      format:     'Do of MMMM YYYY, H:mm:ss',
      placement:  'top'
    };
  },

  /** Render DateView */
  render: function() {
    // Create since object if
    var since;
    if (this.props.since) {
      since = moment(this.props.date).from(this.props.since, true);
      since = "(" + since + " later)";
    }

    return (
      <bs.OverlayTrigger placement={this.props.placement}
                         overlay={this.renderTooltip()}>
        <span>
          {moment(this.props.date).fromNow()}&nbsp;{since}
        </span>
      </bs.OverlayTrigger>
    );
  },

  /** Render tooltip */
  renderTooltip: function() {
    return (
      <bs.Tooltip>
        {moment(this.props.date).format(this.props.format)}
      </bs.Tooltip>
    );
  }
});

// Export DateView
exports.DateView = DateView;