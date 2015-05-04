var React           = require('react');
var WorkerTypeEdit  = require('./workertypeedit');
var StatsTable      = require('./statstable');

var WorkerTypeDetail = React.createClass({
  propTypes: {
    name: React.PropTypes.string.isRequired,
    definition: React.PropTypes.object.isRequired,
    //reload: React.PropTypes.func.isRequired,
    capacityInfo: React.PropTypes.shape({
      running: React.PropTypes.number.isRequired,
      pending: React.PropTypes.number.isRequired,
      spotReq: React.PropTypes.number.isRequired,
    }).isRequired,
    awsState: React.PropTypes.shape({
      running: React.PropTypes.arrayOf(React.PropTypes.object),
      pending: React.PropTypes.arrayOf(React.PropTypes.object),
      spotReq: React.PropTypes.arrayOf(React.PropTypes.object),
    }).isRequired,
  },
  render: function() {
    return (
        <div>
        <h1>{this.props.name}</h1>

        <h2>Worker Type Definition</h2>
        <WorkerTypeEdit value={this.props.definition} reload={this.props.reload} />

        <h2>Capacity Information</h2>
        {this.props.progressBar}

        <h3>Running</h3>
          <p>{this.props.capacityInfo.running} capacity ({this.props.awsState.running.length} instances)</p>
          <StatsTable isSpot={false} states={this.props.awsState.running} />

        <h3>Pending</h3>
          <p>{this.props.capacityInfo.pending} capacity ({this.props.awsState.pending.length} instances)</p>
          <StatsTable isSpot={false} states={this.props.awsState.pending} />

        <h3>Requested</h3>
          <p>{this.props.capacityInfo.spotReq} capacity ({this.props.awsState.spotReq.length} instances)</p>
          <StatsTable isSpot={true} states={this.props.awsState.spotReq} />

        </div>
    );
  },
});

module.exports = WorkerTypeDetail;
