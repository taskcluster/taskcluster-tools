import { PureComponent } from 'react';
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
import { tail } from 'ramda';
import { request } from 'taskcluster-client-web';
import { LinkContainer } from 'react-router-bootstrap';
import Markdown from '../../components/Markdown';
import Snackbar from '../../components/Snackbar';
import DateView from '../../components/DateView';
import Spinner from '../../components/Spinner';
import { stabilityColors } from '../../utils';
import HelmetTitle from '../../components/HelmetTitle';
import Error from '../../components/Error';
import styles from './styles.module.css';

export default class Provisioners extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      provisioners: [],
      provisioner: null,
      error: null,
      provisionerLoading: false,
      provisionersLoading: true,
      actionLoading: false,
      actions: [],
      toasts: []
    };
  }

  componentWillMount() {
    this.loadProvisioners();

    if (this.props.provisionerId) {
      this.loadProvisioner(this.props.provisionerId);
    }
  }

  loadProvisioner(prov) {
    this.setState({ provisionerLoading: true, provisioner: null }, async () => {
      try {
        const provisioner = await this.props.queue.getProvisioner(prov);
        const actions = provisioner.actions.filter(
          action => action.context === 'provisioner'
        );

        this.setState({
          provisioner,
          actions,
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
        const credentials =
          (this.props.userSession &&
            (await this.props.userSession.getCredentials())) ||
          {};

        await request(url, {
          extra: this.props.queue.buildExtraData(credentials),
          credentials,
          method: action.method
        });

        const toast = {
          text: action.title,
          icon: <Icon name="check" />
        };

        this.setState({
          actionLoading: false,
          toasts: this.state.toasts.concat(toast)
        });
      } catch (error) {
        this.setState({ error, actionLoading: false });
      }
    });
  };

  handleToastDismiss = () => this.setState({ toasts: tail(this.state.toasts) });

  render() {
    const {
      provisioners,
      provisioner,
      provisionerLoading,
      provisionersLoading,
      actions,
      actionLoading,
      error
    } = this.state;

    return (
      <div>
        <div>
          <HelmetTitle title="Worker Types Explorer" />
          <h4>Provisioners</h4>
        </div>
        <Snackbar
          toasts={this.state.toasts}
          onDismiss={this.handleToastDismiss}
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
                      to={`/provisioners/${
                        provisioner.provisionerId
                      }/worker-types`}>
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
                        (actions.length
                          ? actions.map((action, key) => (
                              <Button
                                key={`worker-action-${key}`}
                                className={styles.actionButton}
                                bsSize="small"
                                onClick={() => this.handleActionClick(action)}>
                                {action.title}
                              </Button>
                            ))
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
