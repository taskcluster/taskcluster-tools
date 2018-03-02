import { PureComponent } from 'react';
import {
  Grid,
  Row,
  Col,
  ListGroup,
  ListGroupItem,
  Button,
  Glyphicon
} from 'react-bootstrap';
import Icon from 'react-fontawesome';
import VncDisplay from './VncDisplay';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import UserSession from '../../auth/UserSession';

export default class DisplayList extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      displays: [],
      display: null,
      error: null
    };
  }

  componentWillMount() {
    this.load(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (
      UserSession.userChanged(this.props.userSession, nextProps.userSession)
    ) {
      this.setState({ error: null });
    }

    if (
      nextProps.displaysUrl !== this.props.displaysUrl ||
      nextProps.socketUrl !== this.props.socketUrl ||
      nextProps.shared !== this.props.shared
    ) {
      this.load(nextProps);
    }
  }

  load = async props => {
    try {
      const response = await fetch(props.displaysUrl);
      const displays = await response.json();

      this.setState({
        displays,
        display: null,
        error: null
      });
    } catch (err) {
      this.setState({
        error: err,
        displays: null,
        display: null
      });
    }
  };

  setDisplay = display => this.setState({ display });

  renderDisplays() {
    const { error, displays } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (!displays) {
      return <Spinner />;
    }

    return (
      <div>
        <em>
          Pick a display to initiate a VNC session with a display server from
          the container.
        </em>
        <br />
        <br />
        <ListGroup>
          {displays.map(({ display, height, width }, index) => (
            <ListGroupItem
              style={{ cursor: 'pointer' }}
              key={`display-item-${index}`}
              onClick={() => this.setDisplay(display)}>
              <Row>
                <Col md={2}>
                  <Icon name="television" size="4x" />
                </Col>
                <Col md={10}>
                  <h4>
                    Display <code>{display}</code>
                  </h4>
                  Resolution {width} &times; {height}
                </Col>
              </Row>
            </ListGroupItem>
          ))}
        </ListGroup>
        <Button bsStyle="success" onClick={() => this.load(this.props)}>
          <Glyphicon glyph="refresh" /> Refresh
        </Button>
      </div>
    );
  }

  render() {
    const { socketUrl, shared } = this.props;
    const { display } = this.state;

    if (display) {
      return (
        <VncDisplay
          url={`${socketUrl}?display=${display}`}
          shared={shared === 'true'}
        />
      );
    }

    return (
      <Grid>
        <Row>
          <Col md={6} mdOffset={3}>
            <h2>List of Displays</h2>
            {this.renderDisplays()}
          </Col>
        </Row>
      </Grid>
    );
  }
}
