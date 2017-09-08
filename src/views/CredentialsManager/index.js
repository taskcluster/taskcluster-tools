import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import equal from 'deep-equal';
import { credentialInformation } from 'taskcluster-client-web';
import HelmetTitle from '../../components/HelmetTitle';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import DateView from '../../components/DateView';

export default class CredentialsManager extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      info: null,
      showToken: false,
      loading: true,
      error: null
    };
  }

  componentWillMount() {
    this.load(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (!equal(nextProps.credentials, this.props.credentials)) {
      this.load(nextProps);
    }
  }

  async load(props) {
    if (!props.credentials) {
      this.setState({
        info: null,
        error: null,
        loading: false
      });
    }

    try {
      this.setState({
        info: await credentialInformation(props.credentials),
        error: null,
        loading: false
      });
    } catch (err) {
      this.setState({
        info: null,
        error: err,
        loading: false
      });
    }
  }

  showToken = () => this.setState({ showToken: true });

  renderCredentials() {
    const { credentials } = this.props;
    const { info, showToken, error, loading } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (loading) {
      return <Spinner />;
    }

    if (!info) {
      return (
        <div style={{ marginTop: 20 }}>
          <p>No credentials loaded. Please sign in.</p>
        </div>
      );
    }

    return (
      <div style={{ marginTop: 20 }}>
        <table className="table">
          <tbody>
            <tr>
              <td>ClientId</td>
              <td><code>{info.clientId}</code></td>
            </tr>

            <tr>
              <td>AccessToken</td>
              {showToken && credentials ?
              (
                <td>
                  <code>{credentials.accessToken}</code>
                </td>
              ) :
              (
                <td>
                  <Button bsStyle="primary" bsSize="xs" onClick={this.showToken}>show</Button>
                </td>
              )
            }
            </tr>

            <tr>
              <td>Type</td>
              <td>{info.type}</td>
            </tr>

            {info.start && (
            <tr>
              <td>Valid From</td>
              <td><DateView date={info.start} /></td>
            </tr>
          )}

            {info.expiry && (
            <tr>
              <td>Expires</td>
              <td><DateView date={info.expiry} /></td>
            </tr>
          )}

            <tr>
              <td>Scopes</td>
              <td>
                {
                info.scopes.length ?
                  (
                    <div style={{ lineHeight: 1.8 }}>
                      {info.scopes.map((scope, key) => (
                        <div key={`credentials-scopes-${key}`}>
                          <code>{scope}</code>
                        </div>
                      ))}
                    </div>
                  ) :
                  'none (or accessToken is invalid)'
              }
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    return (
      <Row>
        <HelmetTitle title="Credentials Manager" />
        <Col sm={12}>
          <h4>Taskcluster Credentials</h4>
          {this.renderCredentials()}
        </Col>
      </Row>
    );
  }
}
