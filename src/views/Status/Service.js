import React from 'react';
import { string, func } from 'prop-types';
import Tooltip from 'react-tooltip';
import StatusChecker from './StatusChecker';
import { serviceStatusContainer, serviceStatus } from './styles.css';

export default class Service extends React.PureComponent {
  static propTypes = {
    name: string.isRequired,
    description: string.isRequired,
    link: string.isRequired,
    poll: func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = { status: 'loading' };
  }

  componentWillMount() {
    this.poll();
  }

  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  poll = async () => {
    try {
      const status = await new Promise(this.props.poll);

      this.setState({ status });
    } catch (err) {
      this.setState({ status: 'err' });
    }

    this.timer = setTimeout(this.poll, 5000);
  };

  render() {
    const { link, name, description } = this.props;
    const { status } = this.state;

    return (
      <div className={`form-horizontal ${serviceStatusContainer}`}>
        <a href={link} target="_blank" rel="noopener noreferrer">
          <div data-tip={true} data-for={name}>
            <label className={serviceStatus}><StatusChecker status={status} /></label>
            <label className={serviceStatus}>{name}</label>
          </div>
        </a>
        <Tooltip id={name} place="top" type="info" effect="float">
          <span>{description}</span>
        </Tooltip>
      </div>
    );
  }
}
