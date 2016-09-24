import React from 'react';
import ReactDOM from 'react-dom';
import { Row, Col } from 'react-bootstrap';
import * as utils from '../../lib/utils';
import Connect from './connect';
import Layout from '../../lib/Layout';

const hashManager = utils.createHashManager({ separator: '/' });

ReactDOM.render((
  <Layout>
    <Row style={{ marginBottom: 50 }}>
      <Col md={10} mdOffset={1}>
        <Connect hashEntry={hashManager.root()} />
      </Col>
    </Row>
  </Layout>
), document.getElementById('root'));
