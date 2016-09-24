import React from 'react';
import markdown from 'markdown-it';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import moment from 'moment';
import hljs from 'highlight.js';
import slugid from 'slugid';
import './format.less';

/**
 * Awesome Font Icon
 * Derived from github.com/andreypopp/react-fa by Andrey Popp.
 */
export const Icon = React.createClass({
  propTypes: {
    name: React.PropTypes.string.isRequired,
    size: React.PropTypes.oneOf(['lg', '2x', '3x', '4x', '5x']),
    rotate: React.PropTypes.oneOf(['90', '180', '270']),
    flip: React.PropTypes.oneOf(['horizontal', 'vertical']),
    fixedWidth: React.PropTypes.bool,
    spin: React.PropTypes.bool
  },

  render() {
    const {
      name, size, rotate, flip, spin, fixedWidth,
      className, ...props
    } = this.props;

    let classNames = `fa fa-${name}`;

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

    return <span {...props} className={classNames}/>;
  }
});

/** Render Markdown and handle all the particularities */
export const Markdown = React.createClass({
  propTypes: {
    children: React.PropTypes.string
  },

  /** Render Markdown */
  render() {
    const html = markdown().render(this.props.children || '');

    return <span className="markdown-view" dangerouslySetInnerHTML={{ __html: html }}/>;
  }
});

/** Display a date object with optional since property */
export const DateView = React.createClass({
  /** Validate properties */
  propTypes: {
    date: React.PropTypes.oneOfType([
      React.PropTypes.instanceOf(Date),
      React.PropTypes.string
    ]).isRequired,
    since: React.PropTypes.oneOfType([
      React.PropTypes.instanceOf(Date),
      React.PropTypes.string
    ]),
    placement: React.PropTypes.oneOf([
      'left', 'top', 'right', 'bottom'
    ]),
    format: React.PropTypes.string
  },

  /** default properties */
  getDefaultProps() {
    return {
      format: 'Do of MMMM YYYY, H:mm:ss',
      placement: 'top'
    };
  },

  render() {
    const since = this.props.since ?
      `(${moment(this.props.date).from(this.props.since, true)} later)` :
      '';

    this._id = this._id || slugid.v4();

    return (
      <OverlayTrigger placement={this.props.placement} overlay={this.renderTooltip()}>
        <span id={this._id}>
          {moment(this.props.date).fromNow()} {since}
        </span>
      </OverlayTrigger>
    );
  },

  renderTooltip() {
    return (
      <Tooltip id={this._id}>
        {moment(this.props.date).format(this.props.format)}
      </Tooltip>
    );
  }
});

export const Code = React.createClass({
  // Validate properties
  propTypes: {
    children: React.PropTypes.string.isRequired,

    /* eslint-disable consistent-return */
    language: (props, propName) => {
      const language = props[propName];

      if (!hljs.getLanguage(language)) {
        return new Error(`Language '${language}' not supported by highlight.js`);
      }
    }
    /* eslint-enable consistent-return */
  },

  render() {
    const code = hljs.highlight(this.props.language, this.props.children, true);

    return (
      <pre className={`language-${this.props.language}`}>
        <code dangerouslySetInnerHTML={{ __html: code.value }} />
      </pre>
    );
  }
});

export const Collapse = React.createClass({
  propTypes: {
    title: React.PropTypes.node.isRequired,
    children: React.PropTypes.node.isRequired,
    initialExpanded: React.PropTypes.bool
  },

  getDefaultProps() {
    return {
      initialExpanded: false
    };
  },

  getInitialState() {
    return {
      expanded: this.props.initialExpanded
    };
  },

  render() {
    return (
      <div>
        <span onClick={this.toggle}>{this.props.title}</span>
        {this.state.expanded ? <div>{this.props.children}</div> : ''}
      </div>
    );
  },

  toggle() {
    this.setState({ expanded: !this.state.expanded });
  }
});
