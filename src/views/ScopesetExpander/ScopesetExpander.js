import React from 'react';
import { ButtonToolbar, Button, Glyphicon, Row, Col } from 'react-bootstrap';
import equal from 'deep-equal';
import HelmetTitle from '../../components/HelmetTitle';
import ScopeEditor from '../../components/ScopeEditor';

export default class ScopesetExpander extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      scopes: [],
      expandedscopes: null,
      error: null
    };
  }

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

  renderExpandedScopes() {
    const { expandedscopes } = this.state;

    return (
      <div>
        {expandedscopes ? (
          <div>
            <h3>Expanded Scopes</h3>
            <ScopeEditor scopes={expandedscopes.scopes} />
          </div>
        ) : null}
      </div>
    );
  }

  cleanScopesetInput = () => {
    this.setState({ scopes: [] });
  };

  fetchExpandedScopes = async () => {
    try {
      const expandedscopes = await this.props.auth.expandScopes({
        scopes: this.state.scopes
      });

      this.setState({
        expandedscopes,
        error: null
      });
    } catch (err) {
      this.setState({
        expandedscopes: [],
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
            <Button bsStyle="info" onClick={this.fetchExpandedScopes}>
              <Glyphicon glyph="plus" />Expand Scopes
            </Button>
            <Button bsStyle="warning" onClick={this.cleanScopesetInput}>
              <Glyphicon glyph="remove" />Clean
            </Button>
          </ButtonToolbar>
          <ScopeEditor
            editing={true}
            scopes={this.state.scopes}
            scopesUpdated={this.scopesUpdated}
          />
        </Col>
        <Col md={6}>{this.renderExpandedScopes()}</Col>
      </Row>
    );
  }
}
