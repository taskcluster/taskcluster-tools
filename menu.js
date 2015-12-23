// Please make sure that link matches location.pathname for the page otherwise
// we won't be able to detect which page you're currently on.
// Note, only entries with a description will be show on the landing page.
module.exports = [
  {
    title:          "Task Inspector",
    link:           '/task-inspector/',
    icon:           'cube',
    display:        true,
    description: [
      "The task inspector lets you load, monitor and inspect the state, runs,",
      "artifacts, definition and logs of a task in as it is evaluated. You can",
      "also use this tool download private artifacts."
    ].join('\n')
  },
  {
    title:          "Task-Graph Inspector",
    link:           '/task-graph-inspector/',
    icon:           'cubes',
    display:        true,
    description: [
      "Inspect task-graphs, monitor progress, view dependencies, states and",
      "inspect the individual tasks that makes up the task-graph, using the",
      "embedded task-inspector."
    ].join('\n')
  },
  {
    title:          "Task Creator",
    link:           '/task-creator/',
    icon:           'pencil-square-o',
    display:        true,
    description: [
      "Create and submit tasks from the task creator. Created tasks will be",
      "persistent in `localStorage` so you can try again with new parameters"
    ].join('\n')
  },
  {
    title:          "AWS Provisioner",
    link:           '/aws-provisioner/',
    icon:           'server',
    display:        true,
    description: [
      "Manage workertypes known to the AWS Provisioner and check on the status",
      "of AWS Nodes",
    ].join('\n')
  },
  {
    title:          "Client Manager ",
    link:           '/auth/clients/',
    icon:           'users',
    display:        true,
    description: [
      "Manage clients on `auth.taskcluster.net`. This tool allows you to",
      "create, modify and delete clients. You can also reset `accessToken`",
      "and explore indirect scopes."
    ].join('\n')
  },
  {
    title:          "Role Manager",
    link:           '/auth/roles/',
    icon:           'shield',
    display:        true,
    description: [
      "Manage roles on `auth.taskcluster.net`. This tool allows you to",
      "create, modify and delete roles. You can also manage scopes and",
      "and explore indirect scopes."
    ].join('\n')
  },
  {
    title:          "Pulse Inspector",
    link:           '/pulse-inspector/',
    icon:           'wifi',
    display:        true,
    description: [
      "Bind to Pulse exchanges in your browser, observe messages arriving",
      "and inspect messages. Useful when debugging and working with",
      "undocumented Pulse exchanges."
    ].join('\n')
  },
  {
    title:          "Index Browser",
    link:           '/index/',
    icon:           'sitemap',
    display:        true,
    description: [
      "The generic index browser let's you browse through the hierarchy of",
      "namespaces in the index, and discover indexed tasks."
    ].join('\n')
  },
  {
    title:          "Indexed Artifact Browser",
    link:           '/index/artifacts/',
    icon:           'folder-open',
    display:        true,
    description: [
      "The indexed artifact browser, let's you easily view the artifacts",
      "from the latest run of an indexed task."
    ].join('\n')
  },
  {
    title:          "Hooks Manager",
    link:           '/hooks/',
    icon:           'repeat',
    display:        true,
    description: [
      "Manage hooks: tasks that are created in response to events within TaskCluster."
    ].join('\n')
  },
  {
    title:          "Secrets Manager",
    link:           '/secrets/',
    icon:           'user-secret',
    display:        true,
    description: [
      "Manage secrets: values that can only be retrieved with the appropriate scopes."
    ].join('\n')
  },
  {
    type:           'divider',
    display:        false
  },
  {
    title:          "Interactive Shell",
    link:           '/interactive/',
    icon:           'terminal',
    display:        false,
    description: [
      "Open interactive shell within tasks."
    ].join('\n')
  },
  {
    title:          "Interactive Shell",
    link:           '/shell/',
    icon:           'terminal',
    display:        false,
    description: [
      "Open interactive shell within tasks."
    ].join('\n')
  },
  {
    title:          "Interactive Display",
    link:           '/display/',
    icon:           'television',
    display:        false,
    description: [
      "Connect to an interactive display within tasks."
    ].join('\n')
  },
  {
    type:           'divider',
    display:        true
  },
  {
    title:          "Documentation",
    link:           'http://docs.taskcluster.net',
    icon:           'book',
    display:        true,
    description: [
      "Visit the documentation site with documentation for all TaskCluster",
      "APIs and Pulse exchanges."
    ].join('\n')
  },
  {
    title:          "Github Repository",
    link:           'https://github.com/taskcluster/taskcluster-tools',
    icon:           'github',
    display:        true,
    description: [
      "Go to the source code repository for these tools, this site is",
      "completely static, you can trivially implement any hacks you would",
      "and run it locally, or push it any static site hosting."
    ].join('\n')
  },
  {
    title:          "Bugzilla Product",
    link:           'https://bugzilla.mozilla.org/buglist.cgi?product=Taskcluster&bug_status=__open__',
    icon:           'bug',
    display:        true,
    description: [
      "Visit the TaskCluster Bugzilla product to view open bugs, participate",
      "in discussions or report new bugs in TaskCluster."
    ].join('\n')
  },
  {
    type:           'divider',
    display:        true
  },
  {
    title:          "Preferences",
    link:           '/preferences/',
    icon:           'cogs',
    display:        true,
    description: [
      "Manage settings on this site, these settings, stored in `localStorage`,",
      "includes `clientId` and `accessToken` for TaskCluster."
    ].join("\n")
  }
];
