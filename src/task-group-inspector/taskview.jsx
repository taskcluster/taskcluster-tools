import React from 'react';
import { findDOMNode } from 'react-dom';
import $ from 'jquery';
import TaskView from '../lib/ui/taskview';

// Hackish, but I guess this is the npm-given way to use jQuery plugins with browserify :/
global.jQuery = $;
require('bootstrap');

export default React.createClass({
  displayName: 'TaskView',
  componentDidMount() {
    $(findDOMNode(this.refs.affix))
      .affix({
        offset: { top: 320 }
      });
  },
  render() {
    return (
      <div ref="affix">
        <TaskView
          ref="taskView"
          hashEntry={this.props.hashEntry}
          status={this.props.status}
          queue={this.props.queue} />
      </div>
    );
  }
});
