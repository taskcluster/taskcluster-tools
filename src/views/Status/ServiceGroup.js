import React from 'react';
import { string, array } from 'prop-types';
import { Col, ButtonToolbar } from 'react-bootstrap';
import Tooltip from 'react-tooltip';
import Service from './Service';
import { serviceGroup } from './styles.css';

export default class ServiceGroup extends React.PureComponent {
  static propTypes = {
    name: string.isRequired,
    services: array.isRequired,
    description: string.isRequired
  };

  render() {
    const { name, description, services } = this.props;
    return (
      <Col className={serviceGroup} md={6} sm={12}>
        <h4 data-tip={true} data-for={name}>{name}</h4>
        <hr />
        <ButtonToolbar>
          {services.map(service => (
            <Service
              name={service.name}
              key={service.name}
              poll={service.poll}
              description={service.description}
              link={service.link} />
          ))}
        </ButtonToolbar>
        <Tooltip id={name} place="top" type="info" effect="float">
          <span>{description}</span>
        </Tooltip>
      </Col>
    );
  }
}
