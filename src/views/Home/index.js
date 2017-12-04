import React from 'react';
import { Grid, Cell } from 'react-md';
import HelmetTitle from '../../components/HelmetTitle';

export default class Home extends React.PureComponent {
  render() {
    return (
      <div>
        <HelmetTitle blank />
        <Grid>
          <Cell size={12}>
            A collection of tools for Taskcluster components and elements in the
            Taskcluster ecosystem. Here you will find tools to manage
            Taskcluster, as well as run, debug, inspect and view tasks,
            task-graphs, and other Taskcluster related entities.
          </Cell>
        </Grid>
      </div>
    );
  }
}
