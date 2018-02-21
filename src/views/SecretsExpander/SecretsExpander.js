import React from 'react';
import { ButtonToolbar, Button, Glyphicon, Row, Col } from 'react-bootstrap';
import equal from 'deep-equal';
import HelmetTitle from '../../components/HelmetTitle';
import SecretEditor from '../../components/SecretEditor';

export default class SecretsExpander extends React.PureComponent {
  state = {
    secrets: [],
    expandedSecret: null,
    error: null,
    secretIsValid: false
  };

  componentWillReceiveProps(nextProps) {
    if (
      this.state.error &&
      !equal(nextProps.userSession, this.props.userSession)
    ) {
      this.setState({ error: null });
    }
  }

  componentDidUpdate(prevprops, { secretIsValid }) {
    if (!this.secretEditor) {
      return;
    }

    const isValid =
      this.secretEditor.codeEditor.codeMirror.doc.cm.state.lint.marked
        .length === 0;

    if (isValid !== secretIsValid) {
      this.setState({ secretIsValid: isValid });
    }
  }

  loadSecrets = async (props = this.props) => {
    try {
      const { secrets } = await props.secrets.list();

      this.setState({
        secrets,
        error: null
      });
    } catch (err) {
      this.setState({
        secrets: null,
        error: err
      });
    }
  };

  secretUpdated = secret => {
    this.setState({ secret });
  };

  handleClickCleanSecret = () => {
    this.setState({ secret: [] });
  };

  handleClickFetchExpanded = async () => {
    try {
      this.setState({
        expandedSecret: await this.props.expandSecret({
          secret: this.state.secrets
        }),
        error: null
      });
    } catch (err) {
      this.setState({
        expendedSecret: [],
        error: err
      });
    }
  };

  clearSelectedSecret = () =>
    this.props.history.replace(
      `/secrets/${encodeURIComponent(this.props.selectedSecret)}`
    );

  render() {
    return (
      <Row style={{ marginTop: 10 }}>
        <HelmetTitle title="Secret Expander" />
        <Col md={6}>
          <ButtonToolbar style={{ marginBottom: 7 }}>
            <Button bstyle="info" onClick={this.clearSelectedSecret}>
              <Glyphicon glyph="chevron-left" /> Back
            </Button>
            <Button bsStyle="info" onClick={this.handleClickFetchExpanded}>
              <Glyphicon glyph="plus" /> Expand Secret
            </Button>
            <Button bsStyle="warning" onClick={this.handleClickCleanSecret}>
              <Glyphicon glyph="remove" /> Clean
            </Button>
          </ButtonToolbar>
          <SecretEditor
            userSession={this.props.userSession}
            secretId={this.props.secretId}
            secrets={this.props.secrets}
            reloadSecrets={this.reloadSecrets}
            selectSecretId={this.selectSecretId}
          />
        </Col>
      </Row>
    );
  }
}
