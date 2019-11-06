import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import { Col, Row } from 'react-bootstrap';
import Icon from 'react-fontawesome';
import chunk from 'lodash.chunk';
import Markdown from '../../components/Markdown';
import HelmetTitle from '../../components/HelmetTitle';
import links from '../../links';
import { entries, entry, description } from './styles.module.css';

// Please make sure that link matches location.pathname for the page otherwise
// we won't be able to detect which page you're currently on.
const groups = chunk(links, 4);

export default class Home extends PureComponent {
  render() {
    return (
      <div className={entries}>
        <HelmetTitle blank />
        <Row className={description}>
          <Col sm={12}>
            <p>
              A collection of tools for {process.env.APPLICATION_NAME}{' '}
              components and elements in the {process.env.APPLICATION_NAME}{' '}
              ecosystem. Here you will find tools to manage
              {process.env.APPLICATION_NAME} services, as well as run, debug,
              inspect and view tasks, task groups, and other{' '}
              {process.env.APPLICATION_NAME} related entities.
            </p>
          </Col>
        </Row>

        {groups.map((tiles, index) => (
          <Row key={`home-tiles-${index}`}>
            {tiles.map(({ title, link, icon, description }) => (
              <Col sm={3} key={`home-tile-${link}`}>
                {link.startsWith('/') ? (
                  <Link to={link} className={`${entry} thumbnail`}>
                    <h4>
                      <Icon name={icon} /> {title}
                    </h4>
                    <Markdown>{description}</Markdown>
                  </Link>
                ) : (
                  <a
                    href={link}
                    className={`${entry} thumbnail`}
                    target="_blank"
                    rel="noopener noreferrer">
                    <h4>
                      <Icon name={icon} /> {title}
                    </h4>
                    <Markdown>{description}</Markdown>
                  </a>
                )}
              </Col>
            ))}
          </Row>
        ))}
      </div>
    );
  }
}
