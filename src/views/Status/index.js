import React from 'react';
import { Row } from 'react-bootstrap';
import ServiceGroup from './ServiceGroup';
import HelmetTitle from '../../components/HelmetTitle';
import { taskclusterServices, otherServices } from './services';

export default class Dashboard extends React.PureComponent {
  render() {
    return (
      <div style={{ marginBottom: 40 }}>
        <HelmetTitle title="Status" />
        <Row>
          <ServiceGroup
            name="Taskcluster Services"
            services={taskclusterServices}
            description="Taskcluster services" />
          <ServiceGroup
            name="External Services"
            services={otherServices}
            description="Taskcluster-dependent external services" />
        </Row>
      </div>
    );
  }
}
