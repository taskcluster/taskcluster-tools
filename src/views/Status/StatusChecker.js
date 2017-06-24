import React from 'react';
import { string } from 'prop-types';
import Icon from 'react-fontawesome';

const STATUS_DISPLAY = {
  loading: { icon: 'spinner', spin: true, color: 'gray' },
  up: { icon: 'thumbs-up', color: 'green' },
  degraded: { icon: 'exclamation', color: 'orange' },
  down: { icon: 'thumbs-down', color: 'red' },
  err: { icon: 'frown-o', color: 'red' }
};

export default class StatusChecker extends React.PureComponent {
  static propTypes = {
    status: string.isRequired
  };

  render() {
    const { icon, spin, color } = STATUS_DISPLAY[this.props.status] || STATUS_DISPLAY.err;

    return <Icon name={icon} size="lg" spin={spin} className="pull-left" style={{ color }} />;
  }
}
