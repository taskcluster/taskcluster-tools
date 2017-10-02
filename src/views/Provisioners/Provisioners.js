import React from 'react';
import {
  Col,
  Row,
  ListGroup,
  ListGroupItem,
  Label,
  ControlLabel,
  Panel
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Icon from 'react-fontawesome';
import { LinkContainer } from 'react-router-bootstrap';
import Markdown from '../../components/Markdown';
import DateView from '../../components/DateView';
import Spinner from '../../components/Spinner';
import { stabilityColors } from '../../utils';
import HelmetTitle from '../../components/HelmetTitle';
import Error from '../../components/Error';
import styles from './styles.css';

export default class Provisioners extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      provisioners: [],
      provisioner: null,
      error: null
    };
  }

  componentWillMount() {
    this.loadProvisioners();

    if (this.props.provisionerId) {
      this.loadProvisioner(this.props.provisionerId);
    }
  }

  loadProvisioner(provisioner) {
    this.setState({ loading: true, provisioner: null }, async () => {
      try {
        this.setState({
          provisioner: await this.props.queue.getProvisioner(provisioner),
          loading: false,
          error: null
        });
      } catch (error) {
        this.setState({ provisioner: null, loading: false, error });
      }
    });
  }

  async loadProvisioners(token) {
    try {
      const {
        provisioners,
        continuationToken
      } = await this.props.queue.listProvisioners(
        token ? { continuationToken: token, limit: 100 } : { limit: 100 }
      );

      this.setState({
        provisioners: this.state.provisioners.concat(provisioners)
      });

      if (continuationToken) {
        this.loadProvisioners(continuationToken);
      }
    } catch (error) {
      this.setState({
        provisioners: null,
        error
      });
    }
  }

  onProvisionerClick = ({ target }) => this.loadProvisioner(target.innerText);

  render() {
    return (
      <div>
        <div>
          <HelmetTitle title="Worker Types Explorer" />
          <h4>Provisioners</h4>
        </div>
        {this.state.error && <Error error={this.state.error} />}
        <Row>
          <Col md={6}>
            <ListGroup>
              {this.state.provisioners.map((provisioner, key) => (
                <LinkContainer
                  activeStyle={{
                    color: '#555',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd'
                  }}
                  key={`provisioner-${key}`}
                  to={`/provisioners/${provisioner.provisionerId}`}>
                  <ListGroupItem onClick={this.onProvisionerClick}>
                    {provisioner.provisionerId}
                  </ListGroupItem>
                </LinkContainer>
              ))}
            </ListGroup>
          </Col>
          <Col md={6}>
            {this.state.loading && <Spinner />}
            {this.state.provisioner && (
              <div>
                <div className={styles.dataContainer}>
                  <div>
                    <ControlLabel>Provisioner</ControlLabel>
                  </div>
                  <div>
                    <Link
                      to={`/provisioners/${this.state.provisioner
                        .provisionerId}/worker-types`}>
                      {this.state.provisioner.provisionerId}&nbsp;&nbsp;&nbsp;<Icon name="long-arrow-right" />
                    </Link>
                  </div>
                </div>
                <div className={styles.dataContainer}>
                  <div>
                    <ControlLabel>Expires</ControlLabel>
                  </div>
                  <div>
                    <DateView date={this.state.provisioner.expires} />
                  </div>
                </div>
                <div className={styles.dataContainer}>
                  <div>
                    <ControlLabel>Stability</ControlLabel>
                  </div>
                  <div>
                    <Label
                      bsSize="sm"
                      bsStyle={
                        stabilityColors[this.state.provisioner.stability]
                      }>
                      {this.state.provisioner.stability}
                    </Label>
                  </div>
                </div>
                <div>
                  <Panel collapsible defaultExpanded header="Description">
                    <Markdown>
                      {this.state.provisioner.description || '`-`'}
                    </Markdown>
                  </Panel>
                </div>
              </div>
            )}
          </Col>
        </Row>
      </div>
    );
  }
}
