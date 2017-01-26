// Please make sure that link matches location.pathname for the page otherwise
// we won't be able to detect which page you're currently on.
// Note, only entries with a description will be show on the landing page.
module.exports = [
  {
    title: 'Task Inspector',
    link: '/task-inspector/',
    icon: 'cube',
    display: true,
    description: `The task inspector lets you load, monitor, and inspect the state, runs, artifacts,
      definition, and logs of a task as it is evaluated. You can also use this tool to download
      private artifacts.`,
  },
  {
    title: 'Task Group Inspector',
    link: '/task-group-inspector/',
    icon: 'cubes',
    display: true,
    description: `Inspect task groups, monitor progress, view dependencies and states, and inspect
      the individual tasks that make up the task group using the embedded task-inspector.`,
  },
  {
    title: 'Task Creator',
    link: '/task-creator/',
    icon: 'pencil-square-o',
    display: true,
    description: `Create and submit tasks from the task creator. Created tasks will be persistent
      in \`localStorage\` so you can try again with new parameters`,
  },
  {
    title: 'YML Creator',
    link: '/yml-creator/',
    icon: 'github',
    display: true,
    description: `Create a configuration file \`.taskcluster.yml\` to add to your repository and 
    plug TaskCluster into your project`,
  },
  {
    title: 'AWS Provisioner',
    link: '/aws-provisioner/',
    icon: 'server',
    display: true,
    description: `Manage workertypes known to the AWS Provisioner and check on the status of AWS
      Nodes`,
  },
  {
    title: 'AMI sets',
    link: '/ami-sets/',
    icon: 'server',
    display: true,
    description: 'Manage AMI sets known to the AWS Provisioner',
  },
  {
    title: 'Client Manager',
    link: '/auth/clients/',
    icon: 'users',
    display: true,
    description: `Manage clients on \`auth.taskcluster.net\`. This tool allows you to create, modify
      and delete clients. You can also reset \`accessToken\` and explore indirect scopes.`,
  },
  {
    title: 'Role Manager',
    link: '/auth/roles/',
    icon: 'shield',
    display: true,
    description: `Manage roles on \`auth.taskcluster.net\`. This tool allows you to create, modify
      and delete roles. You can also manage scopes and explore indirect scopes.`,
  },
  {
    title: 'Scope Inspector',
    link: '/auth/scopes/',
    icon: 'graduation-cap',
    display: true,
    description: `Explore scopes on \`auth.taskcluster.net\`. This tool allows you to find roles and
      clients with a given scope. This is effectively reverse client and role lookup.`,
  },
  {
    title: 'Pulse Inspector',
    link: '/pulse-inspector/',
    icon: 'wifi',
    display: true,
    description: `Bind to Pulse exchanges in your browser, observe messages arriving and inspect
      messages. Useful when debugging and working with undocumented Pulse exchanges.`,
  },
  {
    title: 'Cache Purge Inspector',
    link: '/purge-caches/',
    icon: 'bolt',
    display: true,
    description: 'View currently active cache purges and schedule a new one if needed.',
  },
  {
    title: 'Index Browser',
    link: '/index/',
    icon: 'sitemap',
    display: true,
    description: `The generic index browser lets you browse through the hierarchy of namespaces in
      the index, and discover indexed tasks.`,
  },
  {
    title: 'Indexed Artifact Browser',
    link: '/index/artifacts/',
    icon: 'folder-open',
    display: true,
    description: `The indexed artifact browser lets you easily view the artifacts from the latest
      run of an indexed task.`,
  },
  {
    title: 'Hooks Manager',
    link: '/hooks/',
    icon: 'repeat',
    display: true,
    description: 'Manage hooks: tasks that are created in response to events within TaskCluster.',
  },
  {
    title: 'Secrets Manager',
    link: '/secrets/',
    icon: 'user-secret',
    display: true,
    description: 'Manage secrets: values that can only be retrieved with the appropriate scopes.',
  },
  {
    type: 'divider',
    display: false,
  },
  {
    title: 'Interactive Shell',
    link: '/interactive/',
    icon: 'terminal',
    display: false,
    description: 'Open interactive shell within tasks.',
  },
  {
    title: 'Interactive Shell',
    link: '/shell/',
    icon: 'terminal',
    display: false,
    description: 'Open interactive shell within tasks.',
  },
  {
    title: 'Interactive Display',
    link: '/display/',
    icon: 'television',
    display: false,
    description: 'Connect to an interactive display within tasks.',
  },
  {
    title: 'One-Click Loaner',
    link: '/one-click-loaner/',
    icon: 'terminal',
    display: false,
    description: 'Create a loaner from an existing task.',
  },
  {
    title: 'Connect to Loaner',
    link: '/one-click-loaner/connect/',
    icon: 'terminal',
    display: false,
    description: 'Connect to an interactive display within tasks.',
  },
  {
    type: 'divider',
    display: true,
  },
  {
    title: 'Documentation',
    link: 'https://docs.taskcluster.net',
    icon: 'book',
    display: true,
    description: `Visit the documentation site with documentation for all TaskCluster APIs and Pulse
      exchanges.`,
  },
  {
    title: 'GitHub Repository',
    link: 'https://github.com/taskcluster/taskcluster-tools',
    icon: 'github',
    display: true,
    description: `Go to the source code repository for these tools. This site is completely static
      and you can implement any changes and run it locally, or push it to any static site hosting.`,
  },
  {
    title: 'Bugzilla Product',
    link: 'https://bugzilla.mozilla.org/buglist.cgi?product=Taskcluster&bug_status=__open__',
    icon: 'bug',
    display: true,
    description: `Visit the TaskCluster Bugzilla product to view open bugs, participate in
      discussions or report new bugs in TaskCluster.`,
  },
  {
    title: 'Credentials',
    link: '/credentials/',
    icon: 'key',
    display: false,
    description: 'Manage credentials stored in the browser.',
  },
  {
    title: 'Status',
    link: '/status/',
    icon: 'cogs',
    display: true,
    description: `Display the status of Taskcluster services and underlying services Taskcluster
      depends on.`,
  },
  {
    title: 'Diagnostics',
    link: '/diagnostics/',
    icon: 'cogs',
    display: true,
    description: 'Display results from diagnostics tests',
  },
];
