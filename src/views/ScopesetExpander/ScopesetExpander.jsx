import { PureComponent } from 'react';
import { ButtonToolbar, Button, Glyphicon, Row, Col } from 'react-bootstrap';
import equal from 'deep-equal';
import HelmetTitle from '../../components/HelmetTitle';
import ScopeEditor from '../../components/ScopeEditor';

export default class ScopesetExpander extends PureComponent {
  static initialState = {
    scopes: [],
    expandedScopes: null,
    error: null,
    scopesIsValid: false
  };
  state = ScopesetExpander.initialState;

  componentWillReceiveProps(nextProps) {
    if (
      this.state.error &&
      !equal(nextProps.userSession, this.props.userSession)
    ) {
      this.setState({ error: null });
    }
  }

  componentDidUpdate(prevProps, { scopesIsValid }) {
    if (!this.scopeEditor) {
      return;
    }

    const isValid =
      this.scopeEditor.codeEditor.codeMirror.doc.cm.state.lint.marked.length ===
      0;

    if (isValid !== scopesIsValid) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ scopesIsValid: isValid });
    }
  }

  handleScopesUpdated = scopes => {
    this.setState({ scopes });
  };

  renderExpandedScopes() {
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
    this.setState(ScopesetExpander.initialState);
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

  registerEditor = ref => {
    this.scopeEditor = ref;
  };

  render() {
    return (
      <Row style={{ marginTop: 10 }}>
        <HelmetTitle title="Scopeset Expander" />
        <Col md={6}>
          <ButtonToolbar style={{ marginBottom: 7 }}>
            <Button
              bsStyle="info"
              onClick={this.handleClickFetchExpanded}
              disabled={
                this.state.scopes.length === 0 || !this.state.scopesIsValid
              }>
              <Glyphicon glyph="plus" /> Expand Scopes
            </Button>
            <Button bsStyle="warning" onClick={this.handleClickCleanScopes}>
              <Glyphicon glyph="remove" /> Clean
            </Button>
          </ButtonToolbar>
          <ScopeEditor
            ref={this.registerEditor}
            editing
            scopes={this.state.scopes}
            onScopesUpdated={this.handleScopesUpdated}
          />
        </Col>
        <Col md={6}>{this.renderExpandedScopes()}</Col>
      </Row>
    );
  }
}
