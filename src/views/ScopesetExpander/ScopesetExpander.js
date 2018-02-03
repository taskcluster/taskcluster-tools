import React from 'react';
import { ButtonToolbar, Button, Glyphicon, Row, Col } from 'react-bootstrap';
import equal from 'deep-equal';
import HelmetTitle from '../../components/HelmetTitle';
import ScopeEditor from '../../components/ScopeEditor';

export default class ScopesetExpander extends React.PureComponent {
  state = {
    scopes: [],
    expandedScopes: null,
    error: null
  };

  componentWillReceiveProps(nextProps) {
    if (
      this.state.error &&
      !equal(nextProps.userSession, this.props.userSession)
    ) {
      this.setState({ error: null });
    }
  }

  scopesUpdated = scopes => {
    this.setState({ scopes });
  };

  renderexpandedScopes() {
    const { expandedScopes } = this.state;

    if (!expandedScopes) {
      return null;
    }

    return (
      <div>
        <h3>Expanded Scopes</h3>
        <ScopeEditor scopes={expandedScopes.scopes} />
      </div>
    );
  }

  handleClickCleanScopes = () => {
    this.setState({ scopes: [] });
  };

  handleClickFetchExpanded = async () => {
    try {
      this.setState({
        expandedScopes: await this.props.auth.expandScopes({
          scopes: this.state.scopes
        }),
        error: null
      });
    } catch (err) {
      this.setState({
        expandedScopes: [],
        error: err
      });
    }
  };

  render() {
    return (
      <Row style={{ marginTop: 10 }}>
        <HelmetTitle title="Scopeset Expander" />
        <Col md={6}>
          <ButtonToolbar style={{ marginBottom: 7 }}>
            <Button bsStyle="info" onClick={this.handleClickFetchExpanded}>
              <Glyphicon glyph="plus" />Expand Scopes
            </Button>
            <Button bsStyle="warning" onClick={this.handleClickCleanScopes}>
              <Glyphicon glyph="remove" />Clean
            </Button>
          </ButtonToolbar>
          <ScopeEditor
            editing={true}
            scopes={this.state.scopes}
            scopesUpdated={this.scopesUpdated}
          />
        </Col>
        <Col md={6}>{this.renderexpandedScopes()}</Col>
      </Row>
    );
  }
}
