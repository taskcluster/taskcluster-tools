import React from 'react';
import ReactDOM from 'react-dom';
import { Row, Col } from 'react-bootstrap';
import OneClickLoaner from './one-click-loaner';
import * as utils from '../lib/utils';
import Layout from '../lib/Layout';

const hashManager = utils.createHashManager({ separator: '/' });

ReactDOM.render((
  <Layout>
    <Row style={{ marginBottom: 50 }}>
      <Col md={8} mdOffset={2}>
        <OneClickLoaner hashEntry={hashManager.root()} />
      </Col>
    </Row>
  </Layout>
), document.getElementById('root'));
