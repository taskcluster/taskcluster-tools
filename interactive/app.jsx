var $                   = require('jquery');
var {hterm, lib}        = require('hterm-umd');
var url                 = require('url');
var qs                  = require('querystring');
var {DockerExecClient}  = require('docker-exec-websocket-server');
var _                   = require('lodash');

// Set default storage engine for hterm
hterm.defaultStorage = new lib.Storage.Local();

$(function () {
  var args = qs.parse(url.parse(window.location.href).query);

  $('#container').append(
    "<div id='terminal' style='position: absolute;left: 0px;right: 0px;bottom: 0px;top: 51px;'></div>"
  );

  var term = new hterm.Terminal('interactive');
  term.onTerminalReady = async () => {
    var io = term.io.push();

    var client = new DockerExecClient({
      url: args.socketUrl,
      tty: true,
      command: [
        'sh', '-c', [
          'if [ -z "$TERM" ]; then export TERM=xterm; fi;',
          'if [ -z "$HOME" ]; then export HOME=/root; fi;',
          'if [ -z "$USER" ]; then export USER=root; fi;',
          'if [ -z "$LOGNAME" ]; then export LOGNAME=root; fi;',
          'if [ -z `which "$SHELL"` ]; then export SHELL=bash; fi;',
          'if [ -z `which "$SHELL"` ]; then export SHELL=sh; fi;',
          'if [ -z `which "$SHELL"` ]; then export SHELL="/.taskclusterutils/busybox sh"; fi;',
          'SPAWN="$SHELL";',
          'if [ "$SHELL" = "bash" ]; then SPAWN="bash -li"; fi;',
          'exec $SPAWN;'
        ].join('')
      ]
    });

    io.onVTKeystroke = io.sendString = d => {
      client.stdin.write(d);
    };
    io.onTerminalResize = () => undefined;

    term.setCursorPosition(0, 0);
    term.setCursorVisible(true);
    term.setScrollbarVisible(false);
    term.prefs_.set('ctrl-c-copy', true);
    term.prefs_.set('ctrl-v-paste', true);
    term.prefs_.set('use-default-window-copy', true);

    await client.execute();
    term.installKeyboard();
    io.writeUTF8('Connected to remote shell for taskId: ' +
                 args.taskId + '\r\n');

    client.on('exit', code => {
      io.writeUTF8('\r\nRemote shell exited: ' + code + '\r\n');
      term.uninstallKeyboard();
      term.setCursorVisible(false);
    });

    client.resize(term.screenSize.height, term.screenSize.width);

    io.onTerminalResize = (c, r) => {
      client.resize(r, c);
    };
    client.stdout.on('data', data => {
      io.writeUTF8(data.toString('utf8'));
    });
    client.stderr.on('data', data => {
      io.writeUTF8(data.toString('utf8'));
    });
  };

  term.decorate($('#terminal')[0]);
});
