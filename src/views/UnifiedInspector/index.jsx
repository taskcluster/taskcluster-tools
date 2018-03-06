import WithClients from '../../components/WithClients';
import WithUserSession from '../../components/WithUserSession';
import Inspector from './Inspector';

const testForLineNumbers = /L(\d+)-?(\d+)?/;
const View = ({ match, history, location }) => {
  const hasHighlight = testForLineNumbers.exec(location.hash);
  const start = hasHighlight && parseInt(hasHighlight[1], 10);
  const end = hasHighlight && parseInt(hasHighlight[2], 10);
  const highlight = end ? [start, end] : start;

  return (
    <WithUserSession>
      {userSession => (
        <WithClients Queue QueueEvents PurgeCache>
          {clients => (
            <Inspector
              {...clients}
              userSession={userSession}
              url={match.url}
              history={history}
              highlight={hasHighlight ? highlight : null}
              taskGroupId={match.params.taskGroupId}
              taskId={match.params.taskId}
              sectionId={match.params.sectionId}
              subSectionId={match.params.subSectionId}
              artifactId={decodeURIComponent(match.params.artifactId)}
              runId={
                match.params.runId ? parseInt(match.params.runId, 10) : null
              }
            />
          )}
        </WithClients>
      )}
    </WithUserSession>
  );
};

export default View;
