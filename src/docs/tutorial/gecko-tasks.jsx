import ReactMarkdown from 'react-markdown';
import nextSteps from '../components/nextSteps';

const view = `
When a developer pushes to a Gecko repository, a long chain of events begins:

 * A "decision task" is created to decide what to do with the push.
 * The decision task creates a lot of additional tasks.
   These tasks include build and test tasks, along with lots of other kinds of tasks to build docker images, build toolchains, perform analyses, check syntax, and so on.
 * These tasks are arranged in a "task graph", with some tasks (e.g., tests) depending on others (builds).
   Once its prerequisite tasks complete, a dependent task begins.
 * The result of each task is sent to [TreeHerder](https://treeherder.mozilla.org) where developers and sheriffs can track the status of the push.
 * The outputs from each task -- log files, Firefox installers, and so on -- appear attached to each task (viewable in the [Task Inspector](https://tools.taskcluster.net/task-inspector/)) when it completes.

Due to its "self-service" design, very little of this process is actually part of Taskcluster, so we provide only a brief overview and some pointers.

Taskcluster provides a small bit of glue ([mozilla-taskcluster](/manual/vcs/mozilla-taskcluster)) to create the decision task and some more ([taskcluster-treeherder](/reference/core/treeherder)) to communicate with treeherder, but the task graph itself is defined entirely in-tree.

${nextSteps([
  {
    label: 'How is the decision task defined',
    path: '/tutorial/gecko-decision-task'
  },
  {
    label: 'How is the task-graph generated?',
    path: '/tutorial/gecko-task-graph'
  },
  {
    label: 'How are the docker images created?',
    path: '/tutorial/gecko-docker-images'
  }
])}
`;
const GeckoTasks = props => <ReactMarkdown source={view} {...props} />;

export default GeckoTasks;
