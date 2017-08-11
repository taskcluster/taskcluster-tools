import React from 'react';
import { string, object } from 'prop-types';
import { Col, Button, Row, Table, Glyphicon, FormGroup, InputGroup, FormControl } from 'react-bootstrap';
import equal from 'deep-equal';
import { Link } from 'react-router-dom';
import Spinner from '../../components/Spinner';

export default class IndexBrowser extends React.PureComponent {
  static propTypes = {
    history: object.isRequired,
    urlRoot: string.isRequired,
    namespace: string.isRequired,
    namespaceTaskId: string
  };

  constructor(props) {
    super(props);

    this.state = {
      namespaceInput: this.props.namespace,
      namespaces: null,
      tasks: null,
      error: null
    };
  }

  componentWillMount() {
    this.loadTasksAndNamespaces(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.namespace !== this.props.namespace) {
      this.loadTasksAndNamespaces(nextProps);
    } else if (this.state.error && !equal(nextProps.credentials, this.props.credentials)) {
      this.setState({ error: null });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.namespaceToken !== this.state.namespaceToken ||
      prevState.tasksToken !== this.state.tasksToken) {
      this.loadTasksAndNamespaces(this.props);
    }
  }

  async loadTasksAndNamespaces({ index, namespace }) {
    try {
      this.setState({
        error: null,
        namespaceInput: namespace,
        tasks: await index.listTasks(namespace, { continuationToken: this.state.tasksToken || undefined }),
        namespaces: await index.listNamespaces(namespace, { continuationToken: this.state.namespaceToken || undefined })
      });
    } catch (err) {
      this.setState({
        error: err,
        namespaceInput: namespace,
        tasks: null,
        namespaces: null
      });
    }
  }

  nextTasks = () => this.setState({ tasksToken: this.state.tasks.continuationToken });

  nextNamespaces = () => this.setState({ namespaceToken: this.state.namespaces.continuationToken });

  handleNamespaceInputChange = e => this.setState({ namespaceInput: e.target.value });

  clearNamespaceToken = () => this.setState({ namespaceToken: null });

  clearTasksToken = () => this.setState({ tasksToken: null });

  loadNamespaceInput = () => {
    this.props.history.replace(`${this.props.urlRoot}/${this.state.namespaceInput}`);
  };

  renderBreadcrumbs() {
    const { namespace, urlRoot } = this.props;
    const parents = namespace.split('.');
    const name = parents.pop();

    return (
      <ol className="breadcrumb namespace-breadcrumbs">
        <li>
          <Link to={urlRoot}>root</Link>
        </li>
        {
          parents.map((parent, index) => {
            const path = parents.slice(0, index + 1).join('.');

            return (
              <li key={`index-breadcrumb-${index}`}>
                <Link to={`${urlRoot}/${path}`}>{parent}</Link>
              </li>
            );
          })
        }
        {name && <li className="active">{name}</li>}
      </ol>
    );
  }

  renderNamespaces() {
    if (!this.state.namespaces) {
      return <Spinner />;
    }

    const tableStyle = { borderTop: 'none', borderBottom: '1px solid #ddd' };

    return (
      <div>
        <Table condensed={true} hover={true} className="namespace-table">
          <tbody>
            {this.state.namespaces && this.state.namespaces.namespaces.map(({ namespace, name }, index) => (
              <tr key={`index-namespace-${index}`}>
                <td style={tableStyle}>
                  <Link to={`${this.props.urlRoot}/${namespace}`}>{name}</Link>
                </td>
              </tr>
          ))}
          </tbody>
        </Table>
        {
          this.state.namespaceToken != null ?
            (
              <Button bsStyle="primary" onClick={this.clearNamespaceToken} className="pull-left">
                <Glyphicon glyph="arrow-left" /> Back to start
              </Button>
            ) :
            null
        }
        {
          this.state.namespaces && this.state.namespaces.continuationToken ?
            (
              <Button bsStyle="primary" onClick={this.nextNamespaces} className="pull-right">
                More namespaces <Glyphicon glyph="arrow-right" />
              </Button>
            ) :
            null
        }
      </div>
    );
  }

  renderTasks() {
    const { namespace, urlRoot } = this.props;

    if (!this.state.tasks) {
      return <Spinner />;
    }

    const tableStyle = { borderTop: 'none', borderBottom: '1px solid #ddd' };

    return (
      <div>
        <Table condensed={true} hover={true} className="namespace-table">
          <tbody>
            {this.state.tasks && this.state.tasks.tasks.map((task, index) => {
              const isCurrent = namespace === task.namespace;
              const taskNamespace = task.namespace.split('.');
              const namespaceTaskId = taskNamespace.pop();

              return (
                <tr key={`index-task-${index}`}>
                  <td className={isCurrent ? 'info' : null} style={tableStyle}>
                    <Link to={`${urlRoot}/${taskNamespace.join('.')}/${namespaceTaskId}`}>
                      {namespaceTaskId}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        {this.state.tasksToken && (
          <Button bsStyle="primary" onClick={this.clearTasksToken} className="pull-left">
            <Glyphicon glyph="arrow-left" /> Back to start
          </Button>
        )}
        {this.state.tasks && this.state.tasks.continuationToken && (
          <Button bsStyle="primary" onClick={this.nextTasks} className="pull-right">
            More tasks <Glyphicon glyph="arrow-right" />
          </Button>
        )}
      </div>
    );
  }

  render() {
    return (
      <Row>
        <Col md={6} className="index-browser">
          {this.renderBreadcrumbs()}
          <form onSubmit={this.loadNamespaceInput}>
            <FormGroup>
              <div>
                <InputGroup>
                  <InputGroup.Button>
                    <Button bsStyle="primary" type="submit">Browse</Button>
                  </InputGroup.Button>
                  <FormControl
                    type="text"
                    value={this.state.namespaceInput}
                    onChange={this.handleNamespaceInputChange} />
                </InputGroup>
              </div>
            </FormGroup>
          </form>
          {this.renderTasks()}
          {this.renderNamespaces()}
        </Col>
        <Col md={6}>
          {this.props.children}
        </Col>
      </Row>
    );
  }
}
