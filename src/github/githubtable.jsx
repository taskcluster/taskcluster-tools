import React from 'react';
import {
  Table,
  Label
} from 'react-bootstrap';
import * as format from '../lib/format';

const buildStateLabel = {
  pending: 'warning',
  success: 'success',
  error: 'danger',
  failure: 'danger'
};

export default React.createClass({

  render() {
    return (
      <Table condensed hover>
        <thead>
          <tr>
            <th>Repository</th>
            <th>Inspect</th>
            <th>State</th>
            <th>Created</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {this.props.builds.map(this.renderBuildRow)}
        </tbody>
      </Table>
    );
  },

  renderBuildRow(build, index) {
    const repo = `${build.organization}/${build.repository}`;
    const ghlink = `https://github.com/${repo}/commit/${build.sha}`;
    const tglink = `/push-inspector/#${build.taskGroupId}`;
    return (
      <tr key={index}>
        <td><code><a target="_blank" href={ghlink}>{repo}</a></code></td>
        <td><code><a target="_blank" href={tglink}>{build.taskGroupId} <i className="fa fa-external-link"/></a></code></td>
        <td><Label bsStyle={buildStateLabel[build.state]}>{build.state}</Label></td>
        <td><format.DateView date={build.created}/></td>
        <td><format.DateView date={build.updated}/></td>
      </tr>
    );
  }
});
