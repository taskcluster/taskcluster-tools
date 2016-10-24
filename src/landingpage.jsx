import React from 'react';
import ReactDOM from 'react-dom';
import {Col, Row} from 'react-bootstrap';
import {chunk} from 'lodash';
import menu from './menu';
import {Markdown, Icon} from './lib/format';
import Layout from './lib/Layout';
import './landingpage.less';

const entries = menu
  .filter(entry => entry.type !== 'divider' && entry.display)
  .map((entry, index) => (
    <Col sm={3} key={index}>
      <a href={entry.link} className="landingpage-entry thumbnail">
        <h4><Icon name={entry.icon || 'wrench'} /> {entry.title}</h4>
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
            <h2>
              Welcome to <span className="landingpage-logo">TaskCluster Tools</span>
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
      {chunk(entries, 4).map((cols, key) => <Row key={key}>{cols}</Row>)}
    </div>
  </Layout>
), document.getElementById('root'));
