import React from 'react';
import { Row } from 'react-bootstrap';
import ServiceGroup from './ServiceGroup';
import { taskclusterServices, otherServices } from './services';

export default class Dashboard extends React.PureComponent {
  render() {
    return (
      <div style={{ marginBottom: 40 }}>
        <Row>
          <ServiceGroup
            name="TaskCluster Services"
            services={taskclusterServices}
            description="TaskCluster services" />
          <ServiceGroup
            name="External Services"
            services={otherServices}
            description="TaskCluster-dependent external services" />
        </Row>
      </div>
    );
  }
}
