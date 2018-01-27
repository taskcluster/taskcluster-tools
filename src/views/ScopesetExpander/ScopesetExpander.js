import React from 'react';
import { ButtonToolbar, Button, Glyphicon, Row, Col } from 'react-bootstrap';
import HelmetTitle from '../../components/HelmetTitle';
import ScopeEditor from '../../components/ScopeEditor';

export default class ScopesetExpander extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      scopes: [],
      expandedscopes: []
    };
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
            <ScopeEditor scopes={expandedscopes} />
          </div>
        ) : null}
      </div>
    );
  }

  cleanScopesetInput = () => {
    this.setState({ scopes: [] });
  };

  fetchExpandedScopes = async () => {
    this.setState({
      expandedscopes: await this.props.auth.expandScopes(this.state.scopes)
    });
  };

  render() {
    return (
      <Row style={{ marginTop: 10 }}>
        <HelmetTitle title="Scopeset Expander" />
        <Col md={6}>
          <ButtonToolbar>
            <Button bsStyle="info" onClick={this.fetchExpandedScopes}>
              <Glyphicon glyph="plus" />Expand Scopes
            </Button>
            <Button onClick={this.cleanScopesetInput}>
              <Glyphicon glyph="remove" />Clean
            </Button>
          </ButtonToolbar>
          <ScopeEditor
            editing={true}
            scopes={this.state.scopes}
            scopesUpdated={this.scopesUpdated}
          />
        </Col>
        <Col md={6}>{this.renderExpandedScopes}</Col>
      </Row>
    );
  }
}
