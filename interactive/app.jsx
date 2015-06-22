var $ = require('jquery');
var Terminal = require('term.js').Terminal;
// var React = require('react');
var url = require('url');
var qs = require('querystring');
var DockerExecClient = require('docker-exec-websocket-server').DockerExecClient;

/*var InteractiveTerminal = React.createClass({
  render: function () {
    return(
      //something goes here
    );
  }
});*/

$(function () {
  window.myDebug = require('debug');
  // React.render(<InteractiveTerminal />, $('#container')[0]);
  var term = new Terminal({
    cols: 80,
    rows: 24,
    useStyle: true,
    screenKeys: true,
    cursorBlink: false
  });

  var args = qs.parse(url.parse(window.location.href).query);

  console.log('connecting to ' + args.socketUrl);
  
  var client = new DockerExecClient({
    url: args.socketUrl,
    tty: true,
    command: '/bin/bash'
  });

  client.execute().then(function () {
    term.on('data', function(data) {
      client.stdin.write(data);
    });

    term.on('title', function(title) {
      document.title = title;
    });

    term.open($('#container')[0]);

    client.stdout.on('data', function (data) {
      term.write(String.fromCharCode.apply(null, data));
    });
    client.stderr.on('data', function (data) {
      term.write(String.fromCharCode.apply(null, data));
    });

    client.on('exit', function (code) {
      term.write('\r\nProcess exited with code ' + code + '\r\n');
    });
    client.on('resumed', function () {
      term.write('\x1b[31mReady\x1b[m\r\n');
    });
  });
});
