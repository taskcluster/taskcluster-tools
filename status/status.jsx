const React = require('react');
const bs = require('react-bootstrap');
const path = require('path');
const $ = require('jquery');
const WWW_Authenticate = require('www-authenticate').parsers.WWW_Authenticate;
const ReactTooltip = require("react-tooltip");
const config = require("../build/status/config")

// Make a request to the cors proxy service
function makeRequest(options, allowHeaders = []) {
  let headers = {};

  if (allowHeaders) {
    headers['X-Cors-Proxy-Expose-Headers'] = allowHeaders.join(', ');
  }

  return $.ajax({
    url: config.CORS_PROXY,
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
    poll: pollTaskclusterService.bind(null, "https://queue.taskcluster.net/v1/ping"),
    link: "https://queue.taskcluster.net/v1/ping",
    description: "queue.taskcluster.net"
  },
  {
    name: "AWS Provisioner",
    poll: pollTaskclusterService.bind(null, "https://aws-provisioner.taskcluster.net/v1/ping"),
    link: "https://aws-provider.taskcluster.net/v1/ping",
    description: "aws-provisioner.taskcluster.net"
  },
  {
    name: "Index",
    poll: pollTaskclusterService.bind(null, "https://index.taskcluster.net/v1/ping"),
    link: "https://index.taskcluster.net/v1/ping",
    description: "index.taskcluster.net"
  },
  {
    name: "Scheduler",
    poll: pollTaskclusterService.bind(null, "https://scheduler.taskcluster.net/v1/ping"),
    link: "https://scheduler.taskcluster.net/v1/ping",
    description: "https://scheduler.taskcluster.net"
  }
];

let otherServices = [
  {
    name: "AWS",
    description: "Amazon Elastic Compute Cloud (Oregon)",
    link: "http://status.aws.amazon.com/",
    poll: async function(cb) {
      try {
        let data = await Promise.resolve(makeRequest({
          url: 'http://status.aws.amazon.com/rss/ec2-us-west-2.rss'
        }));

        let items = data.getElementsByTagName('item');
        if (!items.length) {
          cb(true);
          return;
        }

        let title = items[0].getElementsByTagName('title');
        cb(title[0].innerHTML.startsWith('Service is operating normally'));
      } catch (err) {
        console.log(err.stack || err);
        cb(false);
      }
    }
  },
  {
    name: "Docker Registry",
    description: "Docker images provider",
    link: "https://index.docker.io/",

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
  },
  {
    name: "Heroku",
    description: "https://status.heroku.com/",
    link: "https://status.heroku.com/",
    poll: function(cb) {
      Promise.resolve(makeRequest({
        url: 'https://status.heroku.com/feed'
      }))
      .then(data => cb(!data.length || data[0].title.startsWith('Resolved')))
      .catch(err => {
        console.log(err || err.stack);
        cb(false);
      });
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
  propTypes: {
    name: React.PropTypes.string.isRequired,
    description: React.PropTypes.string.isRequired,
    link: React.PropTypes.string.isRequired,
    poll: React.PropTypes.func.isRequired
  },
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
        <a target="_blank" href={this.props.link}>
          <div data-tip data-for={this.props.name}>
            <label className="service-status"><StatusChecker up={this.state.up}/></label>
            <label className="service-status">{this.props.name}</label>
          </div>
        </a>
        <ReactTooltip id={this.props.name} place="top" type="info" effect="float">
          <span>{this.props.description}</span>
        </ReactTooltip>
      </div>
    );
  }
});

export let ServiceGroup = React.createClass({
  PropTypes: {
    name: React.PropTypes.string.isRequired,
    services: React.PropTypes.array.isRequired,
    description: React.PropTypes.string.isRequired
  },
  render() {
    return (
      <div>
        <h2 data-tip data-for={this.props.name}>{this.props.name}</h2>
        <bs.ButtonToolbar>
          {this.props.services.map(service => {
            return <Service
              name={service.name}
              key={service.name}
              poll={service.poll}
              description={service.description}
              link={service.link}
            />;
          })}
        </bs.ButtonToolbar>
        <ReactTooltip id={this.props.name} place="top" type="info" effect="float">
          <span>{this.props.description}</span>
        </ReactTooltip>
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
        <ServiceGroup name="Taskcluster" services={taskclusterServices} description="Taskcluster services"/>
        <ServiceGroup name="Services" services={otherServices} description="External services Taskcluster depends on"/>
      </bs.Row>
    );
  }
});
