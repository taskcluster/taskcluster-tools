import React from 'react';
import ReactDOM from 'react-dom';
import { Col, Row } from 'react-bootstrap';
import menu from './menu';
import { Markdown, Icon } from './lib/format';
import Layout from './lib/Layout';
import { chunk } from 'lodash';
import './landingpage.less';

const entries = menu
  .filter(entry => entry.type !== 'divider' && entry.display)
  .map((entry, index) => (
    <Col md={4} sm={6} key={index}>
      <a href={entry.link} className="landingpage-entry">
        <h4>{entry.title}</h4>
        <Icon
          name={entry.icon || 'wrench'}
          size="3x"
          className="pull-left"
          style={{ padding: '.2em .25em .15em' }} />
        <Markdown>{entry.description}</Markdown>
      </a>
    </Col>
  ));

ReactDOM.render((
  <Layout>
    <div className="landingpage-entries">
      <Row>
        <Col md={8} mdOffset={2} sm={10} smOffset={1}>
          <div className="landingpage-header">
            <img src={"/lib/assets/taskcluster-180.png"}/>
            <h2>
              <span className="light-font">Welcome to</span>
              <span className="landingpage-logo">TaskCluster Tools</span>
            </h2>
          </div>
        </Col>
      </Row>
      <Row className="landingpage-description">
        <Col sm={12}>
          <p>
            A collection of tools for TaskCluster components and elements in the TaskCluster
            ecosystem. Here you'll find tools to manage TaskCluster, as well as run, debug, inspect
            and view tasks, task-graphs, and other TaskCluster related entities.
          </p>
        </Col>
      </Row>
      {chunk(entries, 3).map((cols, index) => (
        <Row key={index}>
          {cols}
        </Row>
      ))}
    </div>
  </Layout>
), document.getElementById('root'));
