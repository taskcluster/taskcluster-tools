import ReactMarkdown from 'react-markdown';

const view = `
Taskcluster has an "interactive" mode with which you can get a terminal and/or
VNC connection to a running task execution environment.

There are two ways to access this mode. The easiest is to navigate to the
failing task in the [task inspector](https://tools.taskcluster.net/task-inspector/)
and click "One-Click Loaner". Generally speaking, if you had permission to create
the task by pushing to version control, you can re-create it as a loaner. You will
need to be signed in, of course!

Once the new task starts, click the big "shell" button, and there you are.

The slightly harder way is to re-create the task with
\`task.payload.features.interactive\` set to \`true\`.  You can do this directly
by calling the \`queue.createTask\` API method, or for a gecko task by adding
\`--interactive\` to your try invocation.

---

## Using the Shell

A few notes are in order before you get too excited about your newfound shell access:

 * The original task command executes anyway.  You can, of course, kill it manually.
 * The shell stays open until there are no active connections, but only until the task's \`maxRunTime\` expires, at which time it will be forcibly terminated.
 * Tasks generally run on EC2 spot instances which can be killed at any time.

All of which is to say, this is a good environment for poking around to see
what's going on, but you may find yourself disappointed if you try to use it as
a development environment.
`;
const DebugTask = props => <ReactMarkdown source={view} {...props} />;

export default DebugTask;
