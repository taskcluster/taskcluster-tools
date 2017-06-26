import React from 'react';
import Clients from '../../components/Clients';
import Inspector from './Inspector';

const View = ({ credentials, match, history }) => (
  <Clients credentials={credentials} Queue QueueEvents PurgeCache>
    {clients => (
      <Inspector
        {...clients}
        url={match.url}
        history={history}
        taskGroupId={match.params.taskGroupId}
        taskId={match.params.taskId}
        sectionId={match.params.sectionId}
        subSectionId={match.params.subSectionId}
        artifactId={decodeURIComponent(match.params.artifactId)}
        runId={match.params.runId ? parseInt(match.params.runId, 10) : null} />
    )}
  </Clients>
);

export default View;
