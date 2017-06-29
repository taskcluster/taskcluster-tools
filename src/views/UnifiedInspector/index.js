import React from 'react';
import Clients from '../../components/Clients';
import Inspector from './Inspector';

const testForLineNumbers = /L(\d+)-?(\d+)?/;

const View = ({ credentials, match, history, location }) => {
  const hasHighlight = testForLineNumbers.exec(location.hash);
  const start = hasHighlight && parseInt(hasHighlight[1], 10);
  const end = hasHighlight && parseInt(hasHighlight[2], 10);
  const highlight = end ? [start, end] : start;

  return (
    <Clients credentials={credentials} Queue QueueEvents PurgeCache>
      {clients => (
        <Inspector
          {...clients}
          url={match.url}
          history={history}
          highlight={hasHighlight ? highlight : null}
          taskGroupId={match.params.taskGroupId}
          taskId={match.params.taskId}
          sectionId={match.params.sectionId}
          subSectionId={match.params.subSectionId}
          artifactId={decodeURIComponent(match.params.artifactId)}
          runId={match.params.runId ? parseInt(match.params.runId, 10) : null} />
      )}
    </Clients>
  );
};

export default View;
