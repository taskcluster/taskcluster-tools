let $               = require('jquery');
let URL             = require('url');
let qs              = require('querystring');
let _               = require('lodash');
let Promise         = require('promise');
let React           = require('react');
let bs              = require('react-bootstrap');
let format          = require('../lib/format');
let utils           = require('../lib/utils');

// Keep a promise waiting for noVNC scripts to be loaded
let RFBLoaded = new Promise(accept => {
  // Load supporting scripts
  Util.load_scripts([
    'webutil.js', 'base64.js', 'websock.js', 'des.js',
    'keysymdef.js', 'keyboard.js', 'input.js', 'display.js',
    'inflator.js', 'rfb.js', 'keysym.js'
  ]);
  // Once loaded return RFB from window object
  window.onscriptsload = () => accept(window.RFB);
});

const RFB_STATE_LABELS = {
  'failed':         'danger',
  'fatal':          'danger',
  'normal':         'danger',
  'disconnected':   'danger',
  'loaded':         'danger',
};

let Display = React.createClass({
  mixins: [
    // Call this.connect() when props.socketUrl changes
    utils.createWatchStateMixin({
      onProps: {
        connect: ['socketUrl'],
      },
    }),
  ],

  getDefaultProps() {
    return {
      viewOnly: false
    };
  },

  render() {
    return (
      <center>
          <canvas ref='display'>Canvas not supported!</canvas>;
      </center>
    );
  },

  connect() {
    // Ensure we disconnect from previous
    if (this.rfb) {
      this.rfb.disconnect();
      this.rfb = null;
    }

    // Read socketUrl
    let opts = URL.parse(this.props.socketUrl, false);

    // Create remote frame buffer
    try {
      this.rfb = new RFB({
        target:               this.refs.display.getDOMNode(),
        encrypt:              opts.protocol === 'wss:',
        true_color:           true,
        local_cursor:         true,
        shared:               false,
        view_only:            this.props.viewOnly,
        onUpdateState:        this.onUpdateState,
        onPasswordRequired:   this.onPasswordRequired,
        onClipboard:          this.onClipboard,
        onBell:               this.onBell,
        onDesktopName:        this.onDesktopName,
        connectTimeout:       5,
        disconnectTimeout:    5,
      });
    } catch (err) {
      return this.onUpdateState(
        null, 'fatal', null, 'Unable to create RFB client, error: ' + err
      );
    }

    // Get port
    let port = opts.port;
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
  },

  componentWillUnmount() {
    if (this.rfb) {
      this.rfb.disconnect();
      this.rfb = null;
    }
  },

  onDesktopName(rfb, name) {
    console.log('Desktop name: ' + name);
    // TODO: Display desktop name
  },

  onUpdateState(rfb, state, oldstate, msg) {
    let level = RFB_STATE_LABELS[state] || 'danger';
    let message = msg || 'Transitioned from state: ' + state + ' to ' + state;
    console.log(state + ' -> ' + state + ': ' + message);
    // TODO: Display label and message
  },

  onPasswordRequired(rfb) {
    // This shouldn't be necessary, so we just have this sketchy implementation
    rfb.sendPassword(prompt('VNC server wants a password:'));
  },

  onClipboard(rfb, text) {
    console.log('Clipboard received: "' + text + '"');
    //TODO: Figure out how to sync clipboard, it might not be possible
    // maybe we can offer a button to copy out the clipboard...
  },

  onBell() {
    console.log('Bell!');
  },
});


let DisplayList = React.createClass({
  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      // Reload when props.status.taskId changes, ignore credential changes
      reloadOnProps:          ['displaysUrl', 'socketUrl'],
      reloadOnLogin:          false
    })
  ],

  load() {
    return {
      displays: $.getJSON(this.props.displaysUrl),
      //displays: [{display: ':0.0', width: 1024, height: 768}, {display: ':1.0', width: 1600, height: 900}],
      display:  null,
      RFB:      RFBLoaded,
    };
  },

  getInitialState() {
    return {
      displays: [],
      displaysLoaded: true,
      displaysError: undefined,
      RFB:  null,
      RFBLoaded: true,
      RFBError: undefined,
      display: null,
    };
  },

  render() {
    if (this.state.display) {
      let d = encodeURIComponent(this.state.display);
      return this.renderWaitFor('RFB') || (
        <Display
          RFB={this.state.RFB}
          socketUrl={this.props.socketUrl + '?display=' + d}/>
      );
    }
    return this.renderWaitFor('displays') || (
      <bs.Grid>
        <bs.Row>
          <bs.Col md={6} mdOffset={3}>
            <h2>List of Displays</h2>
            <i>
              Pick a display to initiate a VNC session with a display server
              from the container.
            </i><br/><br/>
            <bs.ListGroup>
              {
                this.state.displays.map((d, index) => {
                  return (
                    <bs.ListGroupItem
                      style={{cursor: 'pointer'}}
                      key={index}
                      onClick={this.setDisplay.bind(this, d.display)}>
                        <bs.Row>
                          <bs.Col md={2}>
                            <format.Icon name={'television'} size={'4x'}/>
                          </bs.Col>
                          <bs.Col md={10}>
                            <h4>Display <code>{d.display}</code></h4>
                            Resolution {d.width} &times; {d.height}
                          </bs.Col>
                        </bs.Row>
                    </bs.ListGroupItem>
                  );
                })
              }
            </bs.ListGroup>
            <bs.Button bsStyle="success"
                       onClick={this.reload}>
              <bs.Glyphicon glyph="refresh"/>
              &nbsp;
              Refresh
            </bs.Button>
          </bs.Col>
        </bs.Row>
      </bs.Grid>
    );
  },

  setDisplay(display) {
    this.setState({display});
  }
});


// Render component
$(function() {
  // Get arguments:
  //  * v             (version, always 1)
  //  * socketUrl     (websocket url, needs ?display=...)
  //  * displaysUrl   (url for listing displays)
  //  * taskId
  //  * runId
  let args = qs.parse(URL.parse(window.location.href).query);
  React.render(
    (
      <DisplayList {...args}/>
    ),
    $('#container')[0]
  );
});


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