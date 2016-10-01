import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  Col,
  Button,
  Row,
  Table,
  Glyphicon,
  FormGroup,
  InputGroup,
  FormControl
} from 'react-bootstrap';
import * as utils from '../lib/utils';
import taskcluster from 'taskcluster-client';
import './indexbrowser.less';

/** Generic Index Browser with a custom entryView */
export default React.createClass({
  displayName: 'IndexBrowser',

  mixins: [
    // Calls load()
    utils.createTaskClusterMixin({
      clients: {
        index: taskcluster.Index
      },
      // Reload when state.namespace changes, ignore credentials changes
      reloadOnKeys: ['namespace', 'namespaceToken', 'tasksToken'],
      reloadOnLogin: false
    }),
    // Called handler when state.namespace changes
    utils.createWatchStateMixin({
      onKeys: {
        updateNamespaceInput: ['namespace', 'current'],
        clearContinuationTokens: ['namespace']
      }
    }),
    // Serialize state.taskId to location.hash as string
    utils.createLocationHashMixin({
      keys: ['namespace', 'current'],
      type: 'string'
    })
  ],

  propTypes: {
    entryView: React.PropTypes.func.isRequired,
    hasHashEntry: React.PropTypes.bool.isRequired
  },

  getInitialState() {
    return {
      namespace: '',
      namespaceInput: '',
      namespaceToken: null, // namespace continuationToken
      tasksToken: null, // tasks continuationToken
      current: '', // selected task
      namespaces: { namespaces: [] },
      namespacesLoaded: true,
      namespacesError: null,
      tasks: { tasks: [] },
      tasksLoaded: true,
      tasksError: null
    };
  },

  load() {
    return {
      namespaces: this.index.listNamespaces(this.state.namespace, {
        continuationToken: this.state.namespaceToken || undefined
      }),
      tasks: this.index.listTasks(this.state.namespace, {
        continuationToken: this.state.tasksToken || undefined
      })
    };
  },

  render() {
    const taskInfo = this.state.namespace ?
      (this.renderWaitFor('tasks') || this.renderTasks()) :
      null;

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
                    onChange={this.handleNamespaceInputChange}/>
                </InputGroup>
              </div>
            </FormGroup>
          </form>
          {taskInfo}
          {this.renderWaitFor('namespaces') || this.renderNamespaces()}
        </Col>
        <Col md={6}>
          <this.props.entryView
            namespace={this.state.current}
            hashEntry={this.props.hasHashEntry ? this.nextHashEntry() : null} />
        </Col>
      </Row>
    );
  },

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
  },

  /** Render list of namespaces */
  renderNamespaces() {
    return (
      <div>
        <Table condensed hover className="namespace-table">
          <tbody>
            {this.state.namespaces.namespaces.map((ns, index) => (
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
          this.state.namespaces.continuationToken ? (
            <Button bsStyle="primary" onClick={this.nextNamespaces} className="pull-right">
              More namespaces <Glyphicon glyph="arrow-right" />
            </Button>
          ) : null
        }
      </div>
    );
  },

  /** Render list of tasks */
  renderTasks() {
    return (
      <div>
        <Table condensed hover className="namespace-table">
          <tbody>
            {this.state.tasks.tasks.map((task, index) => {
              const isCurrent = (this.state.current === task.namespace);

              return (
                <tr key={index}>
                  <td
                    onClick={this.setCurrent.bind(this, task.namespace)}
                    className={isCurrent ? 'info' : null}>
                      {task.namespace.split('.').pop()}
                  </td>
                </tr>
              ); })}
          </tbody>
        </Table>
        {
          this.state.tasksToken ? (
            <Button bsStyle="primary" onClick={this.clearTasksToken} className="pull-left">
              <Glyphicon glyph="arrow-left"/> Back to start
            </Button>
          ) : null
        }
        {
          this.state.tasks.continuationToken ? (
            <Button bsStyle="primary" onClick={this.nextTasks} className="pull-right">
              More tasks <Glyphicon glyph="arrow-right"/>
            </Button>
          ) : null
        }
      </div>
    );
  },

  /** Load next tasks */
  nextTasks() {
    this.setState({
      tasksToken: this.state.tasks.continuationToken
    });
  },

  /** Load next namespaces */
  nextNamespaces() {
    this.setState({
      namespaceToken: this.state.namespaces.continuationToken
    });
  },

  /** Update namespace input field */
  updateNamespaceInput() {
    this.setState({ namespaceInput: this.state.namespace });
  },

  /** Handle changes in namespace input field */
  handleNamespaceInputChange() {
    this.setState({
      namespaceInput: findDOMNode(this.refs.namespace).value
    });
  },

  /** Browse a namespace */
  browse(ns) {
    this.setState({
      namespace: ns,
      current: ns,
      tasksToken: null,
      namespaceToken: null
    });
  },

  /** Set current tasks */
  setCurrent(ns) {
    this.setState({
      current: ns
    });
  },

  /** Load from namespace input field */
  loadNamespaceInput(e) {
    if (e) {
      e.preventDefault();
    }

    this.browse(this.state.namespaceInput);
  },

  clearContinuationTokens() {
    this.setState({
      tasksToken: null,
      namespaceToken: null
    });
  },

  clearNamespaceToken() {
    this.setState({
      namespaceToken: null
    });
  },

  clearTasksToken() {
    this.setState({
      tasksToken: null
    });
  }
});
