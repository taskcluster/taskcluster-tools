import { PureComponent } from 'react';
import { Row, Col } from 'react-bootstrap';
import equal from 'deep-equal';
import { credentialInformation } from 'taskcluster-client-web';
import HelmetTitle from '../../components/HelmetTitle';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import DateView from '../../components/DateView';

export default class CredentialsManager extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      info: null,
      error: null
    };
  }

  componentWillMount() {
    this.load(this.props);
  }

  componentWillReceiveProps(nextProps) {
    // try to load info on any change to userSession (including renewal)
    if (!equal(nextProps.userSession, this.props.userSession)) {
      this.load(nextProps);
    }
  }

  async load(props) {
    this.setState({
      info: null,
      error: null
    });

    // get new credential information if there is a userSession
    if (props.userSession) {
      try {
        this.setState({
          info: await this.loadCredentialInfo(props.userSession),
          error: null
        });
      } catch (err) {
        this.setState({
          info: null,
          error: err
        });
      }
    }
  }

  async loadCredentialInfo(userSession) {
    if (!userSession) {
      return;
    }

    return credentialInformation(await userSession.getCredentials());
  }

  renderSignin() {
    const { info, error } = this.state;
    const { userSession } = this.props;
    const isOidc = userSession.type === 'oidc';
    const isCredentials = userSession.type === 'credentials';
    const haveCreds = !!info;

    return (
      <div style={{ marginTop: 20 }}>
        <table className="table">
          <tbody>
            <tr>
              <td>Signed In As</td>
              <td>{userSession.name}</td>
            </tr>

            {isOidc && (
              <tr>
                <td>OIDC User ID</td>
                <td>
                  <code>{userSession.oidcSubject}</code>
                </td>
              </tr>
            )}

            {haveCreds && (
              <tr>
                <td>ClientId</td>
                <td>
                  <code>{info.clientId}</code>
                </td>
              </tr>
            )}

            {haveCreds &&
              isCredentials && (
                <tr>
                  <td>Type</td>
                  <td>{info.type}</td>
                </tr>
              )}

            {haveCreds &&
              isCredentials &&
              info.start && (
                <tr>
                  <td>Valid From</td>
                  <td>
                    <DateView date={info.start} />
                  </td>
                </tr>
              )}

            {haveCreds &&
              isCredentials &&
              info.expiry && (
                <tr>
                  <td>Expires</td>
                  <td>
                    <DateView date={info.expiry} />
                  </td>
                </tr>
              )}

            {haveCreds && (
              <tr>
                <td>Scopes</td>
                <td>
                  {info.scopes.length ? (
                    <div style={{ lineHeight: 1.8 }}>
                      {info.scopes.map((scope, key) => (
                        <div key={`credentials-scopes-${key}`}>
                          <code>{scope}</code>
                        </div>
                      ))}
                    </div>
                  ) : (
                    'none'
                  )}
                </td>
              </tr>
            )}

            {!haveCreds && (
              <tr>
                <td />
                <td>{error ? <Error error={error} /> : <Spinner />}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    return (
      <Row>
        <HelmetTitle title="Credentials Manager" />
        {this.props.userSession ? (
          <Col sm={12}>
            <h4>Credential Information</h4>
            {this.renderSignin()}
          </Col>
        ) : (
          <Col sm={12}>
            <h4>Not Signed In</h4>
            Not signed in - no credentials available.
          </Col>
        )}
      </Row>
    );
  }
}
