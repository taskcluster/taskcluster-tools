// Please make sure that link matches location.pathname for the page otherwise
// we won't be able to detect which page you're currently on.
// Note, only entries with a description will be show on the landing page.
module.exports = [
  {
    title:          "Task Inspector",
    link:           '/task-inspector/',
    icon:           'cube',
    description: [
      "The task inspector lets you load, monitor and inspect the state, runs,",
      "artifacts, definition and logs of a task in as it is evaluated. You can",
      "also use this tool download private artifacts."
    ].join('\n')
  },
  {
    title:          "Authentication Manager",
    link:           '/auth/',
    icon:           'users',
    description: [
      "Manage clients on `auth.taskcluser.net`. This tool allows you to",
      "create, modify and delete client. You can manage which scopes a",
      "client has and reset the `accessToken` for a client if compromised."
    ].join('\n')
  },
  {
    title:          "Pulse Inspector",
    link:           '/pulse-inspector/',
    icon:           'wifi',
    description: [
      "Bind to Pulse exchanges in your browser, observe messages arriving",
      "and inspect messages. Useful when debugging and working with",
      "undocumented Pulse exchanges."
    ].join('\n')
  },
  {
    type:           'divider'
  },
  {
    title:          "Documentation",
    link:           'http://docs.taskcluster.net',
    icon:           'book',
    description: [
      "Visit the documentation site with documentation for all TaskCluster",
      "APIs and Pulse exchanges."
    ].join('\n')
  },
  {
    title:          "Github Repository",
    link:           'https://github.com/taskcluster/taskcluster-tools',
    icon:           'github',
    description: [
      "Go to the source code repository for these tools, this site is",
      "completely static, you can trivially implement any hacks you would",
      "and run it locally, or push it any static site hosting."
    ].join('\n')
  },
  {
    title:          "Bugzilla Component",
    link:           'https://bugzilla.mozilla.org/buglist.cgi?component=TaskCluster&product=Testing&bug_status=__open__',
    icon:           'bug',
    description: [
      "Visit the TaskCluster Bugzilla component to view open bugs, participate",
      "in discussions or report new bugs in TaskCluster."
    ].join('\n')
  },
  {
    type:           'divider'
  },
  {
    title:          "Preferences",
    link:           '/preferences/',
    icon:           'cogs',
    description: [
      "Manage settings on this site, these settings, stored in `localStorage`,",
      "includes `clientId` and `accessToken` for TaskCluster."
    ].join("\n")
  }
];