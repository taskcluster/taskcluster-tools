import React, {Component} from 'react';
import {findDOMNode} from 'react-dom';
import {Col, Button, Row, Table, Glyphicon, FormGroup, InputGroup, FormControl} from 'react-bootstrap';
import {TaskClusterEnhance, CreateWatchState} from '../lib/utils';
import taskcluster from 'taskcluster-client';
import './indexbrowser.less';
import path from 'path';

/** Generic Index Browser with a custom entryView */
class IndexBrowser extends Component {
  constructor(props) {
    super(props);
    const namespace = this.props.match.params.ns || '';

    this.state = {
      namespace,
      namespaceInput: '',
      namespaceToken: null, // namespace continuationToken
      tasksToken: null, // tasks continuationToken
      current: namespace, // selected task
      namespaces: {namespaces: []},
      namespacesLoaded: true,
      namespacesError: null,
      tasks: {tasks: []},
      tasksLoaded: true,
      tasksError: null,
    };

    this.loadNamespaceInput = this.loadNamespaceInput.bind(this);
    this.handleNamespaceInputChange = this.handleNamespaceInputChange.bind(this);
    this.nextTasks = this.nextTasks.bind(this);
    this.clearNamespaceToken = this.clearNamespaceToken.bind(this);
    this.clearContinuationTokens = this.clearContinuationTokens.bind(this);
    this.updateNamespaceInput = this.updateNamespaceInput.bind(this);
    this.nextNamespaces = this.nextNamespaces.bind(this);
    this.load = this.load.bind(this);
    this.onTaskClusterUpdate = this.onTaskClusterUpdate.bind(this);
    this.onWatchReload = this.onWatchReload.bind(this);
  }

  componentWillMount() {
    document.addEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.addEventListener('taskcluster-reload', this.load, false);
    document.addEventListener('watch-reload', this.onWatchReload, false);
  }

  componentWillUnmount() {
    document.removeEventListener('taskcluster-update', this.onTaskClusterUpdate, false);
    document.removeEventListener('taskcluster-reload', this.load, false);
    document.removeEventListener('watch-reload', this.onWatchReload, false);
  }

  /** Update values for reloadOnProps and reloadOnKeys */
  componentDidUpdate(prevProps, prevState) {
    this.props.taskclusterState(this.state, this.props);
    this.props.watchState(this.state, this.props);
  }

  onTaskClusterUpdate({detail}) {
    this.setState(detail);
  }

  onWatchReload({detail}) {
    detail.map(functionName => this[functionName]());
  }

  load(data) {
    if (data && data.detail.name && data.detail.name !== this.constructor.name) {
      return;
    }

    const promisedState = {
      namespaces: this.props.clients.index.listNamespaces(this.state.namespace, {
        continuationToken: this.state.namespaceToken || undefined,
      }),
      tasks: this.props.clients.index.listTasks(this.state.namespace, {
        continuationToken: this.state.tasksToken || undefined,
      })
    };

    this.props.loadState(promisedState);
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
                    <Button bsStyle="primary" onClick={this.loadNamespaceInput}>Browse</Button>
                  </InputGroup.Button>
                  <FormControl
                    type="text"
                    ref="namespace"
                    value={this.state.namespaceInput}
                    onChange={this.handleNamespaceInputChange} />
                </InputGroup>
              </div>
            </FormGroup>
          </form>
          {this.state.namespace && (this.props.renderWaitFor('tasks') || this.renderTasks())}
          {this.props.renderWaitFor('namespaces') || this.renderNamespaces()}
        </Col>
        <Col md={6}>
          <this.props.entryView namespace={this.state.current} />
        </Col>
      </Row>
    );
  }

  /** Render bread crumbs for navigation */
  renderBreadcrumbs() {
    const parents = this.state.namespace.split('.');
    const name = parents.pop();

    return (
      <ol className="breadcrumb namespace-breadcrumbs">
        <li key={-1}>
          <a onClick={this.browse.bind(this, '')}>root</a>
        </li>
        {
          parents.map((name, index) => {
            const path = parents.slice(0, index + 1).join('.');

            return (
              <li key={index}>
                <a onClick={this.browse.bind(this, path)}>{name}</a>
              </li>
            );
          })
        }
        {
          name ?
            <li className="active" key={parents.length}>{name}</li> :
            null
        }
      </ol>
    );
  }

  /** Render list of namespaces */
  renderNamespaces() {
    return (
      <div>
        <Table condensed={true} hover={true} className="namespace-table">
          <tbody>
            {this.state.namespaces && this.state.namespaces.namespaces.map((ns, index) => (
              <tr key={index}>
                <td onClick={this.browse.bind(this, ns.namespace)}>
                  {ns.name}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {
          this.state.namespaceToken != null ? (
            <Button bsStyle="primary" onClick={this.clearNamespaceToken} className="pull-left">
              <Glyphicon glyph="arrow-left" /> Back to start
            </Button>
          ) : null
        }
        {
          this.state.namespaces && this.state.namespaces.continuationToken ? (
            <Button bsStyle="primary" onClick={this.nextNamespaces} className="pull-right">
              More namespaces <Glyphicon glyph="arrow-right" />
            </Button>
          ) : null
        }
      </div>
    );
  }

  /** Render list of tasks */
  renderTasks() {
    return (
      <div>
        <Table condensed={true} hover={true} className="namespace-table">
          <tbody>
            {this.state.tasks && this.state.tasks.tasks.map((task, index) => {
              const isCurrent = (this.state.current === task.namespace);

              return (
                <tr key={index}>
                  <td
                    onClick={this.setCurrent.bind(this, task.namespace)}
                    className={isCurrent ? 'info' : null}>
                    {task.namespace.split('.').pop()}
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

  /** Load next tasks */
  nextTasks() {
    this.setState({
      tasksToken: this.state.tasks.continuationToken,
    });
  }

  /** Load next namespaces */
  nextNamespaces() {
    this.setState({
      namespaceToken: this.state.namespaces.continuationToken,
    });
  }

  /** Update namespace input field */
  updateNamespaceInput() {
    this.setState({namespaceInput: this.state.namespace});
  }

  /** Handle changes in namespace input field */
  handleNamespaceInputChange() {
    this.setState({
      namespaceInput: findDOMNode(this.refs.namespace).value,
    });
  }

  setHistory(ns) {
    const isIndexedArtifact = this.props.match.url.includes('/index/artifacts');

    this.props.history.push(path.join('/index', isIndexedArtifact ? 'artifacts' : '', ns));
  }

  /** Browse a namespace */
  browse(ns) {
    this.setState({
      namespace: ns,
      current: ns,
      tasksToken: null,
      namespaceToken: null,
    });

    this.setHistory(ns);
  }

  /** Set current tasks */
  setCurrent(ns) {
    this.setState({
      current: ns,
    });

    this.setHistory(ns);
  }

  /** Load from namespace input field */
  loadNamespaceInput(e) {
    if (e) {
      e.preventDefault();
    }

    this.browse(this.state.namespaceInput);
  }

  clearContinuationTokens() {
    this.setState({
      tasksToken: null,
      namespaceToken: null,
    });
  }

  clearNamespaceToken() {
    this.setState({
      namespaceToken: null,
    });
  }

  clearTasksToken() {
    this.setState({
      tasksToken: null,
    });
  }
}

const taskclusterOpts = {
  clients: {
    index: taskcluster.Index,
  },
  // Reload when state.namespace changes, ignore credentials changes
  reloadOnKeys: ['namespace', 'namespaceToken', 'tasksToken'],
  reloadOnLogin: false,
  name: IndexBrowser.name
};

const watchStateOpts = {
  onKeys: {
    updateNamespaceInput: ['namespace', 'current'],
    clearContinuationTokens: ['namespace']
  }
};

IndexBrowser.propTypes = {entryView: React.PropTypes.func.isRequired};

export default TaskClusterEnhance(CreateWatchState(IndexBrowser, watchStateOpts), taskclusterOpts);
