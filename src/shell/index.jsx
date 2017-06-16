import React, { Component } from 'react';
import { hterm, lib } from 'hterm-umd';
import url from 'url';
import qs from 'querystring';
import { DockerExecClient } from 'docker-exec-websocket-server';
import wsshell from 'ws-shell';
import Layout from '../lib/Layout';
import './shell.less';

class Shell extends Component {
  constructor(props) {
    super(props);

    const args = qs.parse(url.parse(window.location.href).query);

    // Set default storage engine for hterm
    hterm.defaultStorage = new lib.Storage.Local();

    document.addEventListener('DOMContentLoaded', function contentLoaded() {
      document.removeEventListener('DOMContentLoaded', contentLoaded);

      const term = new hterm.Terminal('interactive');

      term.onTerminalReady = async () => {
        let client;

        // Setup terminal
        // We do this before we connect, so that the terminal window size is known
        // when we send the window size.
        const io = term.io.push();

        io.onVTKeystroke = io.sendString = d => {
          if (client) {
            client.stdin.write(d);
          }
        };
        io.onTerminalResize = () => null;

        term.setCursorPosition(0, 0);
        term.setCursorVisible(true);
        term.setScrollbarVisible(false);
        /* eslint-disable no-underscore-dangle */
        term.prefs_.set('ctrl-c-copy', true);
        term.prefs_.set('ctrl-v-paste', true);
        term.prefs_.set('use-default-window-copy', true);
        /* eslint-enable no-underscore-dangle */

        const options = {
          url: args.socketUrl,
          tty: true,
          command: [
            'sh', '-c', [
              'if [ -f "/etc/taskcluster-motd" ]; then cat /etc/taskcluster-motd; fi;',
              'if [ -z "$TERM" ]; then export TERM=xterm; fi;',
              'if [ -z "$HOME" ]; then export HOME=/root; fi;',
              'if [ -z "$USER" ]; then export USER=root; fi;',
              'if [ -z "$LOGNAME" ]; then export LOGNAME=root; fi;',
              'if [ -z `which "$SHELL"` ]; then export SHELL=bash; fi;',
              'if [ -z `which "$SHELL"` ]; then export SHELL=sh; fi;',
              'if [ -z `which "$SHELL"` ]; then export SHELL="/.taskclusterutils/busybox sh"; fi;',
              'SPAWN="$SHELL";',
              'if [ "$SHELL" = "bash" ]; then SPAWN="bash -li"; fi;',
              'if [ -f "/bin/taskcluster-interactive-shell" ]; then SPAWN="/bin/taskcluster-interactive-shell"; fi;',
              'exec $SPAWN;'
            ].join('')
          ]
        };

        // Create a shell client, with interface similar to child_process
        // With an additional method client.resize(cols, rows) for TTY sizing.
        if (args.v === '1') {
          const dockerClient = new DockerExecClient(options);
          await dockerClient.execute();
          client = dockerClient;

          // Wrap client.resize to switch argument ordering
          const resize = client.resize;
          client.resize = (c, r) => resize.call(client, r, c);
        } else if (args.v === '2') {
          client = await wsshell.dial(options);
        }

        term.installKeyboard();
        io.writeUTF8(`Connected to remote shell for taskId: ${args.taskId}\r\n`);

        client.on('exit', code => {
          io.writeUTF8(`\r\nRemote shell exited: ${code}\r\n`);
          term.uninstallKeyboard();
          term.setCursorVisible(false);
        });

        client.resize(term.screenSize.width, term.screenSize.height);

        io.onTerminalResize = (c, r) => client.resize(c, r);
        client.stdout.on('data', data => {
          io.writeUTF8(data.toString('utf8'));
        });
        client.stderr.on('data', data => {
          io.writeUTF8(data.toString('utf8'));
        });
        client.stdout.resume();
        client.stderr.resume();
      };

      term.decorate(document.getElementById('terminal'));
    });
  }

  render() {
    return (
      <Layout>
        <div id="terminal" />
      </Layout>
    );
  }
}

export default Shell;
