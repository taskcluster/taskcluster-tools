var React = require('react');
var bs = require('react-bootstrap');
var path = require('path');
var $ = require('jquery');
var WWW_Authenticate = require('www-authenticate').parsers.WWW_Authenticate;

function pollTaskclusterService(url, cb) {
  $.getJSON(url, function(data) {
    cb(data.alive);
  }).error(err => {
    cb(false);
  })
}

function dummyPoll(cb) {
  setTimeout(cb.bind(null, true), 0);
}

var taskclusterServices = [
  {
    name: "Queue",
    poll: pollTaskclusterService.bind(null, "https://queue.taskcluster.net/v1/ping")
  },
  {
    name: "Provisioner",
    poll: pollTaskclusterService.bind(null, "https://aws-provisioner.taskcluster.net/v1/ping")
  },
  {
    name: "Index",
    poll: pollTaskclusterService.bind(null, "https://index.taskcluster.net/v1/ping")
  },
  {
    name: "Scheduler",
    poll: pollTaskclusterService.bind(null, "https://scheduler.taskcluster.net/v1/ping")
  }
];

var otherServices = [
  {
    name: "AWS",
    poll: dummyPoll
  },
  {
    name: "Docker Registry",
    poll: dummyPoll
    // Houston, we have a problem.
    // Docker registry doesn't support cross domain requests
    /*poll: function(cb) {
      var handleFail = function(response, err, err2) {
        cb(false);
      };

      $.ajax({
        url: 'https://auth.docker.io/token?service=registry.docker.io',
        method: 'GET',
        dataType: 'json',
        xhrFields: {
          withCredentials: true
        }
      }).done(function(data) {
        $.ajax({
          url: 'https://index.docker.io/v2/',
          method: 'GET',
          dataType: 'json',
          xhrFields: {
            withCredentials: true
          },
          headers: {
            Authorization: `Bearer ${data.token}`
          }
        }).done(function (data) {
          cb(true);
        }).fail(handleFail);
      }).fail(handleFail);
    }*/
  }
];

export var StatusChecker = React.createClass({
  propTypes: {
    up: React.PropTypes.bool.isRequired
  },
  render: function() {
    var image = this.props.up ? "green-check.png" : "red-check.png";
    return (
      <img className="img-check img-fluid center-block" src={image}/>
    );
  }
});

export var Service = React.createClass({
  getInitialState() {
    var intervalId = setInterval(this.props.poll.bind(this, serviceUp => {
      this.setState({up: serviceUp});
    }), 5000);

    return {
      up: true,
      intervalId: intervalId
    };
  },
  render: function() {
    return (
      <div className="form-horizontal service-status-container">
        <label className="service-status"><StatusChecker up={this.state.up}/></label>
        <label className="service-status">{this.props.name}</label>
      </div>
    );
  }
});

export var ServiceGroup = React.createClass({
  PropTypes: {
    name: React.PropTypes.string.isRequired,
    services: React.PropTypes.array.isRequired
  },
  render: function() {
    return (
      <div>
        <h2>{this.props.name}</h2>
        <bs.ButtonToolbar>
          {this.props.services.map(service => {
            return <Service name={service.name} key={service.name} poll={service.poll}/>;
          })}
        </bs.ButtonToolbar>
      </div>
    );
  }
});

export var TaskclusterStatus = React.createClass({
  render: function() {
    return (
      <bs.Col className="taskcluster-status" lg={12} md={12} sm={12} xs={12}>
        <div className="center-block">
          <h1>Taskcluster Status</h1>
        </div>
        <div className="circle center-block">
          <StatusChecker up={true}/>
        </div>
      </bs.Col>
    );
  }
});

export var TaskclusterDashboard  = React.createClass({
  render: function() {
    return (
      <bs.Row>
        <TaskclusterStatus/>
        <ServiceGroup name="Taskcluster" services={taskclusterServices}/>
        <ServiceGroup name="Services" services={otherServices}/>
      </bs.Row>
    );
  }
});
