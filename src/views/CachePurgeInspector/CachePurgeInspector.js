import React from 'react';
import {
  Row, Col, ButtonToolbar, Glyphicon, Table, Button, FormGroup, ControlLabel, FormControl, Alert
} from 'react-bootstrap';
import equal from 'deep-equal';
import Spinner from '../../components/Spinner';
import DateView from '../../components/DateView';
import HelmetTitle from '../../components/HelmetTitle';

export default class CachePurgeInspector extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      caches: null,
      cachesError: null,
      formError: null,
      formProvisionerId: '',
      formWorkerType: '',
      formCacheName: ''
    };
  }

  componentWillMount() {
    this.loadCaches();
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.cachesError && !equal(nextProps.userSession, this.props.userSession)) {
      this.setState({ cachesError: null });
    }
  }

  loadCaches = async () => {
    try {
      const { requests } = await this.props.purgeCache.allPurgeRequests();

      this.setState({
        caches: requests,
        cachesError: null
      });
    } catch (err) {
      this.setState({
        caches: null,
        cachesError: err
      });
    }
  };

  provisionerIdChange = event => this.setState({ formProvisionerId: event.target.value });

  workerTypeChange = event => this.setState({ formWorkerType: event.target.value });

  cacheNameChange = event => this.setState({ formCacheName: event.target.value });

  sendRequest = async () => {
    const { formProvisionerId, formWorkerType, formCacheName } = this.state;

    try {
      await this.props.purgeCache.purgeCache(formProvisionerId, formWorkerType, { cacheName: formCacheName });

      this.setState({
        formProvisionerId: '',
        formWorkerType: '',
        formCacheName: ''
      });

      this.loadCaches();
    } catch (err) {
      this.setState({
        formError: err
      });
    }
  };

  dismissError = () => this.setState({ formError: null, cachesError: null });

  refreshAll = () => {
    this.setState({
      cachesError: null,
      caches: null
    });
    this.loadCaches();
  };

  renderCachesTable() {
    if (!this.state.caches) {
      return <Spinner />;
    }

    return (
      <Table condensed={true} hover={true}>
        <thead>
          <tr>
            <th>Provisioner ID</th>
            <th>Worker Type</th>
            <th>Cache Name</th>
            <th>Before</th>
          </tr>
        </thead>
        <tbody>
          {
            this.state.caches.length ?
              this.state.caches.map(this.renderCacheRow) :
              null
          }
        </tbody>
      </Table>
    );
  }

  renderCacheRow = (cache, index) => (
    <tr key={`cache-row-${index}`}>
      <td><code>{cache.provisionerId}</code></td>
      <td><code>{cache.workerType}</code></td>
      <td><code>{cache.cacheName}</code></td>
      <td><DateView date={cache.before} /></td>
    </tr>
    );

  renderForm() {
    if (this.state.formError) {
      return (
        <Alert bsStyle="danger" onDismiss={this.dismissError}>
          <strong>Error executing operation: </strong> {`${this.state.formError}`}
        </Alert>
      );
    }

    return (
      <div className="form-horizontal">
        <h4 style={{ marginTop: 7 }}>Create Purge Cache Request</h4>
        <hr style={{ marginBottom: 20 }} />

        <FormGroup>
          <ControlLabel className="col-md-3">Provisioner ID</ControlLabel>
          <Col md={9}>
            <FormControl
              type="text"
              placeholder="Provisioner ID"
              value={this.state.formProvisionerId}
              onChange={this.provisionerIdChange} />
          </Col>
        </FormGroup>

        <FormGroup>
          <ControlLabel className="col-md-3">Worker Type</ControlLabel>
          <Col md={9}>
            <FormControl
              type="text"
              placeholder="Worker type"
              value={this.state.formWorkerType}
              onChange={this.workerTypeChange} />
          </Col>
        </FormGroup>

        <FormGroup>
          <ControlLabel className="col-md-3">Cache Name</ControlLabel>
          <Col md={9}>
            <FormControl
              type="text"
              placeholder="Cache name"
              value={this.state.formCacheName}
              onChange={this.cacheNameChange} />
          </Col>
        </FormGroup>

        <p>Please note: The <code>before</code> date-time will be set to current date-time.</p>

        <ButtonToolbar>
          <Button bsStyle="primary" onClick={this.sendRequest}>
            <Glyphicon glyph="plus" /> Create request
          </Button>
        </ButtonToolbar>
      </div>
    );
  }

  render() {
    return (
      <Row>
        <HelmetTitle title="Cache Purge Inspector" />
        <Col md={12}>
          <h4>Cache Purge Inspector</h4>
          <p>
            All currently active cache purges are displayed below.
            24 hours after creation, requests expire and are no longer displayed here.
            The <strong>before</strong> column is the time at which any caches that match the
            previous three classifiers are considered invalid.
            Any caches created after that time are fine.
          </p>
          <hr />
        </Col>
        <Col md={7}>
          <ButtonToolbar>
            <Button
              bsSize="sm"
              bsStyle="success"
              onClick={this.refreshAll}
              disabled={!this.state.caches}>
              <Glyphicon glyph="refresh" /> Refresh All
            </Button>
          </ButtonToolbar>
        </Col>
        <Col md={7}>
          <br /><br />
          {
            this.state.cachesError ?
              (
                <Alert bsStyle="danger" onDismiss={this.dismissError}>
                  <strong>Error executing operation: </strong> {`${this.state.cachesError}`}
                </Alert>
              ) :
              this.renderCachesTable()
          }
        </Col>
        <Col md={5}>
          <br />
          {this.renderForm()}
        </Col>
      </Row>
    );
  }
}

