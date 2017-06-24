import React from 'react';
import { string, bool } from 'prop-types';
import { VncDisplay as VNC } from 'react-vnc-display';

export default class VncDisplay extends React.PureComponent {
  static propTypes = {
    url: string.isRequired,
    shared: bool,
    viewOnly: bool
  };

  static defaultProps = {
    shared: false,
    viewOnly: false
  };

  // This shouldn't be necessary, so we just have this sketchy implementation
  // eslint-disable-next-line no-alert
  onPasswordRequired = (rfb) => rfb.sendPassword(prompt('VNC server wants a password:'));

  render() {
    return (
      <div style={{ textAlign: 'center' }}>
        <VNC
          url={this.props.url}
          view_only={this.props.viewOnly}
          shared={this.props.shared} />
      </div>
    );
  }
}
