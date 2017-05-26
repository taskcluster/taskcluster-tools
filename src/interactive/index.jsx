import React, {Component} from 'react';
import Layout from '../lib/Layout';
import {hterm, lib} from 'hterm-umd';
import url from 'url';
import qs from 'querystring';
import {DockerExecClient} from 'docker-exec-websocket-server';
import './interactive.less';

class Interactive extends Component {
  constructor(props) {
    super(props);

    const args = qs.parse(url.parse(window.location.href).query);

    // Set default storage engine for hterm
    hterm.defaultStorage = new lib.Storage.Local();

    document.addEventListener('DOMContentLoaded', function contentLoaded() {
      document.removeEventListener('DOMContentLoaded', contentLoaded);

      const term = new hterm.Terminal('interactive');

      term.onTerminalReady = async () => {
        const io = term.io.push();
        const client = new DockerExecClient({
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
              'exec $SPAWN;',
            ].join(''),
          ],
        });

        io.onVTKeystroke = io.sendString = d => {
          client.stdin.write(d);
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

        await client.execute();

        term.installKeyboard();
        io.writeUTF8(`Connected to remote shell for taskId: ${args.taskId}\r\n`);

        client.on('exit', code => {
          io.writeUTF8(`\r\nRemote shell exited: ${code}\r\n`);
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

export default Interactive;
