const React = require('react');
const bs = require('react-bootstrap');
const path = require('path');
const $ = require('jquery');
const WWW_Authenticate = require('www-authenticate').parsers.WWW_Authenticate;

// Make a request to the cors proxy service
function makeRequest(options, allowHeaders = []) {
  let headers = {};

  if (allowHeaders) {
    headers['X-Cors-Proxy-Expose-Headers'] = allowHeaders.join(', ');
  }

  return $.ajax({
    url: 'http://localhost:8080/request',
    method: 'POST',
    contentType: 'application/json',
    headers,
    data: JSON.stringify(options)
  });
}

function pollTaskclusterService(url, cb) {
  $.getJSON(url)
    .done(data => cb(data.alive))
    .fail(err => cb(false));
}

function dummyPoll(cb) {
  setTimeout(cb.bind(null, true), 0);
}

let taskclusterServices = [
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

let otherServices = [
  {
    name: "AWS",
    poll: dummyPoll
  },
  {
    name: "Docker Registry",

    // Authentication procedure is described at
    // https://docs.docker.com/registry/spec/auth/token/
    poll: async function(cb) {
      let req;

      try {
        req = makeRequest({
          url: 'https://index.docker.io/v2/',
        }, [
          'www-authenticate'
        ]);

        await Promise.resolve(req);
      } catch (err) {
        if (err.status != 401) {
          cb(false);
          return;
        }

        try {
          let auth = new WWW_Authenticate(req.getResponseHeader('www-authenticate'));

          let data = await Promise.resolve(makeRequest({
            url: `${auth.parms.realm}?service=${auth.parms.service}`
          }));

          await Promise.resolve(makeRequest({
            url: 'https://index.docker.io/v2/',
            method: 'GET',
            headers: {
              Authorization: `${auth.scheme} ${data.token}`
            }
          }));
        } catch (err) {
          console.log(err.stack || err);
          cb(false);
          return;
        }
      }

      cb(true);
    }
  }
];

export let StatusChecker = React.createClass({
  propTypes: {
    up: React.PropTypes.bool.isRequired
  },
  render: function() {
    let image = this.props.up ? "green-check.png" : "red-check.png";
    return (
      <img className="img-check img-fluid center-block" src={image}/>
    );
  }
});

export let Service = React.createClass({
  getInitialState() {
    let intervalId = setInterval(this.props.poll.bind(this, serviceUp => {
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

export let ServiceGroup = React.createClass({
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

export let TaskclusterStatus = React.createClass({
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

export let TaskclusterDashboard  = React.createClass({
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
