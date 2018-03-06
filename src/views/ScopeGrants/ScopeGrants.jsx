import { PureComponent } from 'react';
import {
  Row,
  Col,
  Button,
  Glyphicon,
  ListGroup,
  ListGroupItem,
  Table,
  Form,
  FormGroup,
  ControlLabel,
  FormControl
} from 'react-bootstrap';
import { equals, uniq, merge, without, unnest } from 'ramda';
import Icon from 'react-fontawesome';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import UserSession from '../../auth/UserSession';
import HelmetTitle from '../../components/HelmetTitle';
import Markdown from '../../components/Markdown';
import ModalItem from '../../components/ModalItem';
import PATTERNS from './patterns';
import { instantiate, instantiatedArguments } from './granting';

export default class ScopeGrants extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      roles: null,
      error: null,
      selected: null,
      args: {}
    };
  }

  componentWillMount() {
    this.load();
  }

  componentWillReceiveProps(nextProps) {
    if (
      UserSession.userChanged(this.props.userSession, nextProps.userSession)
    ) {
      this.setState({ error: null });
    }

    if (this.props.pattern !== nextProps.pattern) {
      this.setState({ selected: null, args: {} });
    }
  }

  async load() {
    try {
      this.setState({
        roles: await this.props.auth.listRoles(),
        error: null
      });
    } catch (err) {
      this.setState({
        roles: null,
        error: err
      });
    }
  }

  handleGrantsRedirect = () => this.props.history.push(`/auth/grants`);
  handleNewGrant = () => this.setState({ selected: null, args: {} });

  renderGrants() {
    if (this.state.error) {
      return <Error error={this.state.error} />;
    }

    if (!this.state.roles) {
      return <Spinner />;
    }

    const pattern = PATTERNS.find(p => p.name === this.props.pattern);
    const instantiatedArgs = instantiatedArguments(pattern, this.state.roles);
    const params = Object.keys(pattern.params);

    return (
      <Row>
        <Col md={12}>
          <HelmetTitle title={pattern.title} />
          <Row>
            <Col md={1}>
              <Button onClick={this.handleGrantsRedirect}>
                <Glyphicon glyph="chevron-left" /> Back
              </Button>
            </Col>
            <Col md={10}>
              <h2>
                <Icon name={pattern.icon} /> {pattern.title}
              </h2>
              <Markdown>{pattern.description}</Markdown>
            </Col>
          </Row>
          <hr />
          <Row>
            <Col md={6}>
              <Table hover>
                <thead>
                  <tr>
                    {params.map((param, index) => (
                      <th key={`grant-${index}`}>{param}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {instantiatedArgs.map((args, index) => (
                    <tr
                      key={`args-${index}`}
                      style={{ cursor: 'pointer' }}
                      className={
                        equals(args, this.state.selected) ? 'info' : null
                      }
                      onClick={() => this.setState({ selected: args })}>
                      {params.map((param, index) => (
                        <td key={`params-${index}`}>
                          <code>{args[param]}</code>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
              <hr />
              <Button onClick={this.handleNewGrant}>
                <Glyphicon glyph="plus" /> New Grant
              </Button>
              <br />
              <br />
            </Col>
            <Col md={6}>
              {this.state.selected
                ? this.renderPatternInstance(pattern, this.state.selected)
                : this.renderCreateForm(pattern)}
            </Col>
          </Row>
        </Col>
      </Row>
    );
  }

  handleSave = async pattern => {
    const instance = instantiate(pattern, this.state.args);
    const roles = await this.props.auth.listRoles();
    const toCreate = [];
    const toUpdate = [];

    Object.keys(instance).forEach(r => {
      if (roles.some(({ roleId }) => r === roleId)) {
        toUpdate.push(r);
      } else {
        toCreate.push(r);
      }
    });

    await Promise.all([
      ...toCreate.map(role =>
        this.props.auth.createRole(role, {
          description: '',
          scopes: instance[role]
        })
      ),
      ...toUpdate.map(role => {
        const { scopes, description } = roles.find(
          ({ roleId }) => roleId === role
        );

        return this.props.auth.updateRole(role, {
          description,
          scopes: uniq([...scopes, ...instance[role]])
        });
      })
    ]);
  };

  handleCreatedCompleted = async () => {
    const { args } = this.state;

    this.setState({ selected: null, roles: null, args: {} });
    await this.load();
    this.setState({ selected: args });
  };

  handleParamChanged = (param, e) => {
    this.setState({
      args: merge(this.state.args, { [param]: e.target.value })
    });
  };

  validateArg = (pattern, param) =>
    this.state.args[param] &&
    pattern.params[param].exec(this.state.args[param]);

  renderCreateForm(pattern) {
    const params = Object.keys(pattern.params);
    const { args } = this.state;

    return (
      <span>
        <h3>Grant Scopes</h3>
        <Form horizontal>
          {params.map((param, index) => (
            <FormGroup
              key={index}
              validationState={
                this.validateArg(pattern, param) ? 'success' : 'error'
              }>
              <Col componentClass={ControlLabel} sm={2}>
                {param}
              </Col>
              <Col sm={10}>
                <FormControl
                  type="text"
                  placeholder={pattern.params[param].source.slice(1, -1)}
                  onChange={e => this.handleParamChanged(param, e)}
                />
                <FormControl.Feedback />
              </Col>
            </FormGroup>
          ))}
          <FormGroup>
            <Col smOffset={2} sm={10}>
              <ModalItem
                button
                bsStyle="primary"
                onSubmit={() => this.handleSave(pattern)}
                disabled={!params.every(p => this.validateArg(pattern, p))}
                onComplete={this.handleCreatedCompleted}
                body={
                  <span>
                    Are you sure you want to <b>grant scopes</b>?
                    <br />
                    <br />
                    {this.renderInstanceGrants(pattern, args)}
                    This will create or update roles as necessary to create the
                    above scope grants.
                  </span>
                }>
                <Glyphicon glyph="plus" /> Grant Scopes
              </ModalItem>
            </Col>
          </FormGroup>
        </Form>
      </span>
    );
  }

  handleReload = () => {
    this.setState({ selected: null, roles: null });
    this.load();
  };

  handleRemove = async pattern => {
    const instance = instantiate(pattern, this.state.selected);
    const roles = await this.props.auth.listRoles();

    await Promise.all(
      roles
        .filter(({ roleId }) => instance[roleId])
        .map(({ roleId, description, scopes }) =>
          this.props.auth.updateRole(roleId, {
            description,
            scopes: without(instance[roleId], scopes)
          })
        )
    );
  };

  renderPatternInstance(pattern, args) {
    const params = Object.keys(pattern.params);

    return (
      <span>
        <h3>Selected Parameters</h3>
        <dl className="dl-horizontal">
          {unnest(
            params.map((param, index) => [
              <dt key={`key-${index}`}>{param}</dt>,
              <dd key={`val-${index}`}>
                <code>{args[params]}</code>
              </dd>
            ])
          )}
        </dl>
        <h3>Scope Grants</h3>
        {this.renderInstanceGrants(pattern, args)}
        <hr />
        <ModalItem
          button
          bsStyle="danger"
          onSubmit={() => this.handleRemove(pattern)}
          onComplete={this.handleReload}
          body={
            <span>
              Are you sure you want to <strong>remove scope grants </strong>
              from role?
              <br />
              <br />
              {this.renderInstanceGrants(pattern, args)}
            </span>
          }>
          <Icon name="trash" /> Delete Grant
        </ModalItem>
      </span>
    );
  }

  renderInstanceGrants(pattern, args) {
    let inst;

    try {
      inst = instantiate(pattern, args);
    } catch (err) {
      return <Error error={err} />;
    }

    return (
      <ul>
        {Object.keys(inst).map((roleId, index) => (
          <li key={`role:${index}`} className="list-unstyled">
            <Icon name="users" fixedWidth /> <code>{roleId}</code>
            <ul>
              {inst[roleId].map((scope, index) => (
                <li key={`scope-${index}`}>
                  <code>{scope}</code>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    );
  }

  handleOpenPattern = name => this.props.history.push(`/auth/grants/${name}`);

  renderPatternSelector() {
    return (
      <Col smOffset={1} sm={10}>
        <h2>Scope Grant Patterns</h2>
        <p>
          This <em>scope grant</em> tool is an administrative utility for
          granting scopes by creating or updating roles following predefined
          patterns. These patterns are declared in the taskcluster-tools
          repository. Each pattern takes a set of parameters that is used to
          instantiate scope patterns which are then granted to instantiated role
          patterns. Below is a list of supported patterns. After selecting a
          pattern, this tool will display existing instantiations of the pattern
          by inspecting existing roles and enable creation of new
          instantiations.
        </p>
        <br />
        <ListGroup>
          {PATTERNS.map(({ name, title, icon, description }, index) => (
            <ListGroupItem
              key={`pattern-${index}`}
              header={
                <h3>
                  <Icon name={icon} /> {title}
                </h3>
              }
              onClick={() => this.handleOpenPattern(name)}>
              <Markdown>{description}</Markdown>
            </ListGroupItem>
          ))}
        </ListGroup>
      </Col>
    );
  }

  render() {
    if (
      !this.props.pattern ||
      !PATTERNS.some(p => p.name === this.props.pattern)
    ) {
      return (
        <Row>
          <HelmetTitle title="Grant Scopes" />
          {this.renderPatternSelector()}
        </Row>
      );
    }

    return this.renderGrants();
  }
}
