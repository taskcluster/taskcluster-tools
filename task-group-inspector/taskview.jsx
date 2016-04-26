let React = require('react');
let $ = require('jquery');
let TaskView = require('../lib/ui/taskview');

// Hackish, but I guess this is the npm-given way to use jQuery plugins with
// browserify :/
global.jQuery = $;
require('bootstrap');

module.exports = React.createClass({
  componentDidMount: function() {
    $(this.refs.affix)
      .affix({
        offset: { top: 320 }
      });
  },
  render: function() {
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
