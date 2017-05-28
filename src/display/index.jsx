import React, {Component} from 'react';
import $ from 'jquery';
import URL from 'url';
import qs from 'querystring';
import {Grid, Row, Col, ListGroup, ListGroupItem, Button, Glyphicon} from 'react-bootstrap';
import * as format from '../lib/format';
import {TaskClusterEnhance, CreateWatchState} from '../lib/utils';
import Layout from '../lib/Layout';
import './include/util.js';
import './app.less';

// const RFB_STATE_LABELS = {
//   failed: 'danger',
//   fatal: 'danger',
//   normal: 'danger',
//   disconnected: 'danger',
//   loaded: 'danger'
// };

class Display extends Component {
  constructor(props) {
    super(props);

    this.onBell = this.onBell.bind(this);
    this.onClipboard = this.onClipboard.bind(this);
    this.onPasswordRequired = this.onPasswordRequired.bind(this);
    this.onDesktopName = this.onDesktopName.bind(this);
    this.connect = this.connect.bind(this);
    this.onWatchReload = this.onWatchReload.bind(this);
  }

  componentWillMount() {
    document.addEventListener('watch-reload', this.onWatchReload, false);
  }

  componentWillUnmount() {
    document.removeEventListener('watch-reload', this.onWatchReload, false);
  }

  componentDidMount() {
    this.props.watchState(this.state, this.props);
  }

  componentDidUpdate(prevProps, prevState) {
    this.props.watchState(this.state, this.props);
  }

  onWatchReload({detail}) {
    detail.map(functionName => this[functionName]());
  }

  render() {
    return (
      <div style={{textAlign: 'center'}}>
        <canvas ref={instance => { this.displayInstance = instance; }}>Canvas not supported!</canvas>
      </div>
    );
  }

  connect() {
    // Ensure we disconnect from previous
    if (this.rfb) {
      this.rfb.disconnect();
      this.rfb = null;
    }

    // Read socketUrl
    const opts = URL.parse(this.props.socketUrl, false);

    // Create remote frame buffer
    try {
      this.rfb = new RFB({
        target: this.displayInstance,
        encrypt: opts.protocol === 'wss:',
        true_color: true,
        local_cursor: true,
        shared: this.props.shared,
        view_only: this.props.viewOnly,
        onUpdateState: this.onUpdateState,
        onPasswordRequired: this.onPasswordRequired,
        onClipboard: this.onClipboard,
        onBell: this.onBell,
        onDesktopName: this.onDesktopName,
        connectTimeout: 5,
        disconnectTimeout: 5,
      });
    } catch (err) {
      this.onUpdateState(null, 'fatal', null, `Unable to create RFB client, error: ${err}`);
      return;
    }

    // Get port
    let {port} = opts;

    if (!port) {
      if (opts.protocol === 'wss:') {
        port = 443;
      } else {
        port = 80;
      }
    }

    // Path in the broken form
    let pathWithSlash = opts.path;

    if (/^\//.test(pathWithSlash)) {
      pathWithSlash = pathWithSlash.slice(1);
    }

    // Connect to the frame buffer
    this.rfb.connect(opts.hostname, parseInt(port), '', pathWithSlash);
  }

  componentWillUnmount() {
    if (this.rfb) {
      this.rfb.disconnect();
      this.rfb = null;
    }
  }

  onDesktopName(/* rfb, name */) {
    // TODO: Display desktop name
  }

  onUpdateState(/* rfb, state, oldstate, msg */) {
    // TODO: Display label and message
    // const level = RFB_STATE_LABELS[state] || 'danger';
    // const message = msg || `Transitioned from state: ${state} to ${state}`;

    // console.log(`${state} -> ${state}: ${message}`);
  }

  onPasswordRequired(rfb) {
    // This shouldn't be necessary, so we just have this sketchy implementation
    rfb.sendPassword(prompt('VNC server wants a password:')); // eslint-disable-line no-alert
  }

  onClipboard(/* rfb, text */) {
    // TODO: Figure out how to sync clipboard, it might not be possible
    // maybe we can offer a button to copy out the clipboard...
    // console.log(`Clipboard received: "${text}"`);
  }

  onBell() {
    // TODO: Handle bell
    // console.log('Bell!');
  }
}

Display.defaultProps = {
  viewOnly: false,
  shared: false
};

const watchStateOpts = {
  onProps: {
    connect: ['socketUrl', 'shared']
  }
};

const DisplayEnhanced = CreateWatchState(Display, watchStateOpts);


class DisplayList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      displays: [],
      displaysLoaded: true,
      displaysError: null,
      RFB: null,
      RFBLoaded: true,
      RFBError: null,
      display: null
    };

    // Keep a promise waiting for noVNC scripts to be loaded
    this.RFBLoaded = new Promise(accept => {
      // Load supporting scripts
      Util.load_scripts([
        'webutil.js', 'base64.js', 'websock.js', 'des.js',
        'keysymdef.js', 'keyboard.js', 'input.js', 'display.js',
        'inflator.js', 'rfb.js', 'keysym.js',
      ]);
      // Once loaded return RFB from window object
      window.onscriptsload = () => accept(window.RFB);
    });

    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
    this.load = this.load.bind(this);
  }

  componentWillMount() {
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.addEventListener('taskcluster-reload', this.load, false);

    this.load();
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.removeEventListener('taskcluster-reload', this.load, false);
  }

  onTaskClusterUpdate({detail}) {
    if (detail.name !== this.constructor.name) {
      return;
    }

    this.setState(detail.state);
  }

  componentDidUpdate(prevProps, prevState) {
    this.props.taskclusterState(this.state, this.props);
  }

  load(data) {
    if (typeof data === 'object' && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    const promisedState = {
      displays: $.getJSON(this.props.displaysUrl),
      display: null,
      RFB: this.RFBLoaded
    };

    this.props.loadState(promisedState);
  }

  render() {
    if (this.state.display) {
      const display = encodeURIComponent(this.state.display);

      return this.props.renderWaitFor('RFB') || (
          <DisplayEnhanced
            RFB={this.state.RFB}
            socketUrl={`${this.props.socketUrl}?display=${display}`}
            shared={this.props.shared === 'true'} />
        );
    }

    return this.props.renderWaitFor('displays') || (
        <Grid>
          <Row>
            <Col md={6} mdOffset={3}>
              <h2>List of Displays</h2>
              <i>
                Pick a display to initiate a VNC session with a display server from the container.
              </i>
              <br /><br />
              <ListGroup>
                {
                  this.state.displays && this.state.displays.map((d, index) => (
                    <ListGroupItem
                      style={{cursor: 'pointer'}}
                      key={index}
                      onClick={() => this.setDisplay(d.display)}>
                      <Row>
                        <Col md={2}>
                          <format.Icon name="television" size="4x" />
                        </Col>
                        <Col md={10}>
                          <h4>Display <code>{d.display}</code></h4>
                          Resolution {d.width} &times; {d.height}
                        </Col>
                      </Row>
                    </ListGroupItem>
                  ))
                }
              </ListGroup>
              <Button bsStyle="success" onClick={this.load}>
                <Glyphicon glyph="refresh" /> Refresh
              </Button>
            </Col>
          </Row>
        </Grid>
      );
  }

  setDisplay(display) {
    this.setState({display});
  }
}

const displayListTaskclusterOpts = {
  // Reload when props.status.taskId changes, ignore credential changes
  reloadOnProps: ['displaysUrl', 'socketUrl', 'shared'],
  reloadOnLogin: false,
  name: DisplayList.name
};

const DisplayListEnhanced = TaskClusterEnhance(DisplayList, displayListTaskclusterOpts);

const DisplayView = () => {
  // Get arguments:
  //  * v             (version, always 1)
  //  * socketUrl     (websocket url, needs ?display=...)
  //  * displaysUrl   (url for listing displays)
  //  * taskId
  //  * runId
  //  * shared
  const args = qs.parse(URL.parse(window.location.href).query);

  return (
    <Layout>
      <DisplayListEnhanced {...args} />
    </Layout>
  );
};

export default DisplayView;

/*

 var rfb;
 var resizeTimeout;

 function UIresize() {
 if (WebUtil.getQueryVar('resize', false)) {
 var innerW = window.innerWidth;
 var innerH = window.innerHeight;
 var controlbarH = $D('noVNC_status_bar').offsetHeight;
 var padding = 5;
 if (innerW !== undefined && innerH !== undefined)
 rfb.setDesktopSize(innerW, innerH - controlbarH - padding);
 }
 }
 function FBUComplete(rfb, fbu) {
 UIresize();
 rfb.set_onFBUComplete(function() { });
 }
 function passwordRequired(rfb) {
 var msg;
 msg = '<form onsubmit="return setPassword();"';
 msg += '  style="margin-bottom: 0px">';
 msg += 'Password Required: ';
 msg += '<input type=password size=10 id="password_input" class="noVNC_status">';
 msg += '<\/form>';
 $D('noVNC_status_bar').setAttribute("class", "noVNC_status_warn");
 $D('noVNC_status').innerHTML = msg;
 }
 function setPassword() {
 rfb.sendPassword($D('password_input').value);
 return false;
 }
 function sendCtrlAltDel() {
 rfb.sendCtrlAltDel();
 return false;
 }
 function xvpShutdown() {
 rfb.xvpShutdown();
 return false;
 }
 function xvpReboot() {
 rfb.xvpReboot();
 return false;
 }
 function xvpReset() {
 rfb.xvpReset();
 return false;
 }
 function updateState(rfb, state, oldstate, msg) {
 var s, sb, cad, level;
 s = $D('noVNC_status');
 sb = $D('noVNC_status_bar');
 cad = $D('sendCtrlAltDelButton');
 switch (state) {
 case 'failed':       level = "error";  break;
 case 'fatal':        level = "error";  break;
 case 'normal':       level = "normal"; break;
 case 'disconnected': level = "normal"; break;
 case 'loaded':       level = "normal"; break;
 default:             level = "warn";   break;
 }

 if (state === "normal") {
 cad.disabled = false;
 } else {
 cad.disabled = true;
 xvpInit(0);
 }

 if (typeof(msg) !== 'undefined') {
 sb.setAttribute("class", "noVNC_status_" + level);
 s.innerHTML = msg;
 }
 }

 window.onresize = function () {
 // When the window has been resized, wait until the size remains
 // the same for 0.5 seconds before sending the request for changing
 // the resolution of the session
 clearTimeout(resizeTimeout);
 resizeTimeout = setTimeout(function(){
 UIresize();
 }, 500);
 };

 function xvpInit(ver) {
 var xvpbuttons;
 xvpbuttons = $D('noVNC_xvp_buttons');
 if (ver >= 1) {
 xvpbuttons.style.display = 'inline';
 } else {
 xvpbuttons.style.display = 'none';
 }
 }

 window.onscriptsload = function () {
 var host, port, password, path, token;

 $D('sendCtrlAltDelButton').style.display = "inline";
 $D('sendCtrlAltDelButton').onclick = sendCtrlAltDel;
 $D('xvpShutdownButton').onclick = xvpShutdown;
 $D('xvpRebootButton').onclick = xvpReboot;
 $D('xvpResetButton').onclick = xvpReset;

 WebUtil.init_logging(WebUtil.getQueryVar('logging', 'warn'));
 document.title = unescape(WebUtil.getQueryVar('title', 'noVNC'));
 // By default, use the host and port of server that served this file
 host = WebUtil.getQueryVar('host', window.location.hostname);
 port = WebUtil.getQueryVar('port', window.location.port);

 // if port == 80 (or 443) then it won't be present and should be
 // set manually
 if (!port) {
 if (window.location.protocol.substring(0,5) == 'https') {
 port = 443;
 }
 else if (window.location.protocol.substring(0,4) == 'http') {
 port = 80;
 }
 }

 // If a token variable is passed in, set the parameter in a cookie.
 // This is used by nova-novncproxy.
 token = WebUtil.getQueryVar('token', null);
 if (token) {
 WebUtil.createCookie('token', token, 1)
 }

 password = WebUtil.getQueryVar('password', '');
 path = WebUtil.getQueryVar('path', 'websockify');

 if ((!host) || (!port)) {
 updateState(null, 'fatal', null, 'Must specify host and port in URL');
 return;
 }

 try {
 rfb = new RFB({'target':       $D('noVNC_canvas'),
 'encrypt':      WebUtil.getQueryVar('encrypt',
 (window.location.protocol === "https:")),
 'repeaterID':   WebUtil.getQueryVar('repeaterID', ''),
 'true_color':   WebUtil.getQueryVar('true_color', true),
 'local_cursor': WebUtil.getQueryVar('cursor', true),
 'shared':       WebUtil.getQueryVar('shared', true),
 'view_only':    WebUtil.getQueryVar('view_only', false),
 'onUpdateState':  updateState,
 'onXvpInit':    xvpInit,
 'onPasswordRequired':  passwordRequired,
 'onFBUComplete': FBUComplete});
 } catch (exc) {
 updateState(null, 'fatal', null, 'Unable to create RFB client -- ' + exc);
 return; // don't continue trying to connect
 }

 rfb.connect(host, port, password, path);
 };

 };
 */
