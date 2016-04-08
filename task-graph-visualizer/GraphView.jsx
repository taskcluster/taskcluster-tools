var React = require('react');

GraphView = React.createClass({
  componentDidMount:function () {
    this.sig = this.props.sigma;
    this.cam = this.props.camera;
    this.renderer = sig.addRenderer({
      container: 'graph-container'
    });
    sig.refresh();
  },

  render: function () {
    return (
      <div id="graph-container"></div>
    );
  },

  componentWillUnmount: function () {
    this.sig.killRenderer(this.renderer);
  }

});

module.exports = GraphView;
