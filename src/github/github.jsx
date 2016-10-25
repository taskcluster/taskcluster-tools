import React from 'react';
import _ from 'lodash';
import {
  Row,
  Col,
  Alert
} from 'react-bootstrap';
import * as utils from '../lib/utils';
import taskcluster from 'taskcluster-client';
import { hashHistory } from 'react-router';
import GithubTable from './githubtable';
import GithubForm from './githubform';

export default React.createClass({
  displayName: 'Github',

  /** Initialize mixins */
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        github: taskcluster.Github
      }
    })
  ],

  /** Create an initial state */
  getInitialState() {
    return {
      builds: null,
      buildsLoaded: false,
      tableError: null,
      organization: this.props.params.organization || '',
      repository: this.props.params.repository || '',
      sha: this.props.params.sha || ''
    };
  },

  load() {
    return {
      builds: this.github
        .builds(_.omitBy(_.pick(this.state, ['organization', 'repository', 'sha']), filter => filter.length === 0))
        .then(resp => _.reverse(_.sortBy(resp.builds, 'updated')))
    };
  },

  /** Render the main layout of the github page */
  render() {
    return (
      <Row>
        <Col md={12}>
          <GithubForm params={this.props.params} onSubmit={this.formUpdate}/>
        </Col>
        <Col md={12}>
          {
            this.state.tableError ? (
              <Alert bsStyle="danger" onDismiss={this.dismissError}>
                <strong>Error executing operation: </strong> {`${this.state.tableError}`}
              </Alert>
            ) :
            this.renderBuildsTable()
          }
        </Col>
      </Row>
    );
  },

  renderBuildsTable() {
    try {
      return this.renderWaitFor('builds') || (
        <GithubTable builds={this.state.builds}></GithubTable>
      );
    } catch (err) {
      this.setState({ tableError: err });
    }
  },

  dismissError() {
    this.setState({ tableError: null });
  },

  formUpdate({ organization, repository, sha }) {
    let params = '/';
    params = organization ? params.concat(organization) : params;
    params = repository ? params.concat(`/${repository}`) : params;
    params = sha ? params.concat(`/${sha}`) : params;
    hashHistory.push(params);
    this.setState({
      organization,
      repository,
      sha
    }, this.reload);
  }
});
