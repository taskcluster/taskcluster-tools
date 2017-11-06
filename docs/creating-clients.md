---
title: Creating Clients
---

The process for [getting user
credentials](https://docs.taskcluster.net/reference/integrations/taskcluster-login/docs/getting-user-creds)
is designed for other frontend applications that can use OIDC flow. That does
not work for command-line tools.

Tools provides an alternative flow to support non-OIDC applications. The
process involves a browser and a redirect flow that finishes at a URL pointing
to a local server, containing Taskcluster credentials. For command-line tools,
this is a small webserver running within the tool itself. The tool itself
requests that the user either create a new client or reset the `accessToken`
for an existing client.

The tool should open a new browser window with a URL with prefix
`https://tools.taskcluster.net/auth/clients/new` and the following URL-encoded
query parameters:

* `name` -- name suffix for the client
* `description` -- description of the client
* `scope` (can be repeated) -- scopes the new client will need
* `expires` -- time until the new client expires
* `callback_url` -- URL to which the resulting credentials will be sent

The `name` should be the same from one invocation to the next by the same tool,
allowing the user to re-use an existing client of the same name. The `clientId`
will be created by appending the `name` to a prefix where the user has
permission to create clients. The `description` will become the description of
the newly-created user.

The `scope` parameter can be specified multiple times, and allows the creation
of a client with only the required scopes -- a good security practice. The
resulting client's scopes are the *intersection* of the user's scopes and the
`scope` parameters. For example, a tool for administering the hooks service
might request `?scope=hooks:*&scope=assume:hook-id:*`.

The `expires` parameter specifies a lifetime for the resulting clientId, in a
format defined by [taskcluster-client's
fromNow](https://docs.taskcluster.net/reference/libraries/taskcluster-client#relative-date-time-utilities).
For example, `?expires=3h` would result in credentials expiring in 3 hours.

Finally, `callback_url` is the URL to which the user's browser should be
redirected with the resulting client. It is called with the URL-encoded query
parameters `clientId` and `accessToken`. When this URL is accessed, the
command-line tool should respond with some simple HTML for the browser to
display, then extract the credentials from the URL and use them as desired.
