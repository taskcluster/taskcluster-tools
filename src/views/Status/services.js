import React from 'react';
import $ from 'jquery';
import { parsers } from 'www-authenticate';

const WebAuthentication = parsers.WWW_Authenticate;

// Make a request to the cors proxy service
function makeRequest(options, allowHeaders = []) {
  const headers = {};

  if (allowHeaders) {
    headers['X-Cors-Proxy-Expose-Headers'] = allowHeaders.join(', ');
  }

  return $.ajax({
    headers,
    url: process.env.CORS_PROXY,
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(options)
  });
}

function pollTaskclusterService(key, cb) {
  return $
    .getJSON(`https://api.uptimerobot.com/getMonitors?apiKey=${key}&format=json&noJsonCallback=1`)
    .done(res => {
      const [monitor] = res.monitors.monitor;

      // 2 is 'up'
      cb(monitor.status === '2' ? 'up' : 'down');
    })
    .fail(() => {
      cb('err');
    });
}

export const taskclusterServices = [
  {
    name: 'Queue',
    poll: pollTaskclusterService.bind(null, process.env.UPTIMEROBOT_API_KEY_QUEUE),
    link: 'https://queue.taskcluster.net/v1/ping',
    description: 'queue.taskcluster.net'
  },
  {
    name: 'Auth',
    poll: pollTaskclusterService.bind(null, process.env.UPTIMEROBOT_API_KEY_AUTH),
    link: 'https://auth.taskcluster.net/v1/ping',
    description: 'auth.taskcluster.net'
  },
  {
    name: 'AWS Provisioner',
    poll: pollTaskclusterService.bind(null, process.env.UPTIMEROBOT_API_KEY_AWS_PROVISIONER),
    link: 'https://aws-provisioner.taskcluster.net/v1/ping',
    description: 'aws-provisioner.taskcluster.net'
  },
  {
    name: 'Events',
    poll: pollTaskclusterService.bind(null, process.env.UPTIMEROBOT_API_KEY_EVENTS),
    link: 'https://events.taskcluster.net/v1/ping',
    description: 'events.taskcluster.net'
  },
  {
    name: 'Index',
    poll: pollTaskclusterService.bind(null, process.env.UPTIMEROBOT_API_KEY_INDEX),
    link: 'https://index.taskcluster.net/v1/ping',
    description: 'index.taskcluster.net'
  },
  {
    name: 'Scheduler',
    poll: pollTaskclusterService.bind(null, process.env.UPTIMEROBOT_API_KEY_SCHEDULER),
    link: 'https://scheduler.taskcluster.net/v1/ping',
    description: 'https://scheduler.taskcluster.net'
  },
  {
    name: 'Secrets',
    poll: pollTaskclusterService.bind(null, process.env.UPTIMEROBOT_API_KEY_SECRETS),
    link: 'https://secrets.taskcluster.net/v1/ping',
    description: 'https://secrets.taskcluster.net'
  }
];

export const otherServices = [
  {
    name: 'AWS',
    description: 'Amazon Elastic Compute Cloud (Oregon)',
    link: 'http://status.aws.amazon.com/',
    poll: async cb => {
      try {
        const data = await Promise.resolve(makeRequest({
          url: 'http://status.aws.amazon.com/rss/ec2-us-west-2.rss'
        }));

        const items = data.getElementsByTagName('item');

        if (!items.length) {
          cb('up');
          return;
        }

        const title = items[0].getElementsByTagName('title');

        cb(title[0].innerHTML.startsWith('Service is operating normally') ? 'up' : 'down');
      } catch (err) {
        cb('down');
      }
    }
  },
  {
    name: 'Docker Registry',
    description: 'Docker images provider',
    link: 'https://index.docker.io/',

    // Authentication procedure is described at
    // https://docs.docker.com/registry/spec/auth/token/
    poll: async cb => {
      let req;

      try {
        req = makeRequest({ url: 'https://index.docker.io/v2/' }, ['www-authenticate']);

        await Promise.resolve(req);
      } catch (err) {
        if (err.status !== 401) {
          cb('down');

          return;
        }

        try {
          const auth = new WebAuthentication(req.getResponseHeader('www-authenticate'));
          const data = await Promise.resolve(makeRequest({
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
          cb('err');

          return;
        }
      }

      cb('up');
    }
  },
  {
    name: 'Heroku',
    description: 'https://status.heroku.com/',
    link: 'https://status.heroku.com/',
    poll: cb => {
      Promise.resolve(makeRequest({
        url: 'https://status.heroku.com/feed'
      }))
        .then(data => cb((!data.length || data[0].title.startsWith('Resolved')) ? 'up' : 'down'))
        .catch(() => {
          cb('err');
        });
    }
  }
];
