var $ = require('jquery');
var Terminal = require('term.js').Terminal;
var url = require('url');
var qs = require('querystring');
var DockerExecClient = require('docker-exec-websocket-server').DockerExecClient;

$(function () {
  window.myDebug = require('debug');

  var args = qs.parse(url.parse(window.location.href).query);

  var height = args.h || 36;
  var width = args.w || 160;

  var term = new Terminal({
    cols: width,
    rows: height,
    useStyle: true,
    screenKeys: true,
    cursorBlink: true
  });

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

    client.resize(height, width);
  });
});
