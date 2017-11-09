import React from 'react';
import {
  Col,
  Row,
  ListGroup,
  ListGroupItem,
  Label,
  ButtonToolbar,
  Button,
  ControlLabel,
  Panel
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Icon from 'react-fontawesome';
import { LinkContainer } from 'react-router-bootstrap';
import Markdown from '../../components/Markdown';
import Notification from '../../components/Notification';
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
      error: null,
      provisionerLoading: false,
      provisionersLoading: true,
      actionLoading: false
    };
  }

  componentWillMount() {
    this.loadProvisioners();

    if (this.props.provisionerId) {
      this.loadProvisioner(this.props.provisionerId);
    }
  }

  loadProvisioner(provisioner) {
    this.setState({ provisionerLoading: true, provisioner: null }, async () => {
      try {
        this.setState({
          provisioner: await this.props.queue.getProvisioner(provisioner),
          provisionerLoading: false,
          error: null
        });
      } catch (error) {
        this.setState({ provisioner: null, provisionerLoading: false, error });
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

      if (continuationToken) {
        this.setState({
          provisioners: this.state.provisioners.concat(provisioners)
        });
        this.loadProvisioners(continuationToken);
      }

      this.setState({
        provisioners: this.state.provisioners.concat(provisioners),
        provisionersLoading: false
      });
    } catch (error) {
      this.setState({
        provisioners: null,
        error
      });
    }
  }

  handleProvisionerClick = ({ target }) =>
    this.loadProvisioner(target.innerText);

  handleActionClick = action => {
    const url = action.url.replace('<provisionerId>', this.props.provisionerId);

    this.setState({ actionLoading: true }, async () => {
      try {
        const response = await fetch(url, {
          method: action.method,
          mode: 'cors'
        });

        await response.json();

        this.notification.show(
          <span>
            {action.name}&nbsp;&nbsp;<Icon name="check" />
          </span>
        );

        this.setState({ actionLoading: false });
      } catch (error) {
        this.setState({ error, actionLoading: false });
      }
    });
  };

  render() {
    const {
      provisioners,
      provisioner,
      provisionerLoading,
      provisionersLoading,
      actionLoading,
      error
    } = this.state;

    return (
      <div>
        <div>
          <HelmetTitle title="Worker Types Explorer" />
          <h4>Provisioners</h4>
        </div>
        <Notification
          ref={child => {
            this.notification = child;
          }}
        />
        {error && <Error error={error} />}
        <Row>
          <Col md={6}>
            {provisionersLoading && <Spinner />}
            <ListGroup>
              {provisioners.map(({ provisionerId }, key) => (
                <LinkContainer
                  activeStyle={{
                    color: '#555',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd'
                  }}
                  key={`provisioner-${key}`}
                  to={`/provisioners/${provisionerId}`}>
                  <ListGroupItem onClick={this.handleProvisionerClick}>
                    {provisionerId}
                  </ListGroupItem>
                </LinkContainer>
              ))}
            </ListGroup>
          </Col>
          <Col md={6}>
            {provisionerLoading && <Spinner />}
            {provisioner && (
              <div>
                <div className={styles.dataContainer}>
                  <div>
                    <ControlLabel>Provisioner</ControlLabel>
                  </div>
                  <div>
                    <Link
                      to={`/provisioners/${provisioner.provisionerId}/worker-types`}>
                      {provisioner.provisionerId}&nbsp;&nbsp;&nbsp;<Icon name="long-arrow-right" />
                    </Link>
                  </div>
                </div>
                <div className={styles.dataContainer}>
                  <div>
                    <ControlLabel>Expires</ControlLabel>
                  </div>
                  <div>
                    <DateView date={provisioner.expires} />
                  </div>
                </div>
                <div className={styles.dataContainer}>
                  <div>
                    <ControlLabel>Stability</ControlLabel>
                  </div>
                  <div>
                    <Label
                      bsSize="sm"
                      bsStyle={stabilityColors[provisioner.stability]}>
                      {provisioner.stability}
                    </Label>
                  </div>
                </div>
                <div
                  className={`${styles.dataContainer} ${styles.actionLabel}`}>
                  <div>
                    <ControlLabel>Actions</ControlLabel>
                  </div>
                  <div>
                    <ButtonToolbar>
                      {!actionLoading &&
                        (provisioner.actions.length
                          ? provisioner.actions.map(
                              (action, key) =>
                                action.context === 'provisioner' && (
                                  <Button
                                    key={`worker-action-${key}`}
                                    className={styles.actionButton}
                                    bsSize="small"
                                    onClick={() =>
                                      this.handleActionClick(action)}>
                                    {action.name}
                                  </Button>
                                )
                            )
                          : '-')}
                      {actionLoading && <Spinner />}
                    </ButtonToolbar>
                  </div>
                </div>
                <div>
                  <Panel collapsible defaultExpanded header="Description">
                    <Markdown>{provisioner.description || '`-`'}</Markdown>
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
