module.exports = {
  "version": 0,
  "$schema": "http://schemas.taskcluster.net/base/v1/api-reference.json#",
  "title": "Hooks API Documentation",
  "description": "Hooks are a mechanism for creating tasks in response to events.\n\nHooks are identified with a `hookGroupId` and a `hookId`.\n\nWhen an event occurs, the resulting task is automatically created.  The\ntask is created using the scope `assume:hook-id:<hookGroupId>/<hookId>`,\nwhich must have scopes to make the createTask call, including satisfying all\nscopes in `task.scopes`.\n\nHooks can have a 'schedule' indicating specific times that new tasks should\nbe created.  Each schedule is in a simple cron format, per \nhttps://www.npmjs.com/package/cron-parser.  For example:\n * `[\"0 0 1 * * *\"]` -- daily at 1:00 UTC\n * `[\"0 0 9,21 * * 1-5\", \"0 0 12 * * 0,6\"]` -- weekdays at 9:00 and 21:00 UTC, weekends at noon",
  "baseUrl": "https://hooks.taskcluster.net/v1",
  "entries": [
    {
      "type": "function",
      "method": "get",
      "route": "/hooks",
      "args": [],
      "name": "listHookGroups",
      "stability": "experimental",
      "title": "List hook groups",
      "description": "This endpoint will return a list of all hook groups with at least one hook.",
      "output": "http://schemas.taskcluster.net/hooks/v1/list-hook-groups-response.json"
    },
    {
      "type": "function",
      "method": "get",
      "route": "/hooks/<hookGroupId>",
      "args": [
        "hookGroupId"
      ],
      "name": "listHooks",
      "stability": "experimental",
      "title": "List hooks in a given group",
      "description": "This endpoint will return a list of all the hook definitions within a\ngiven hook group.",
      "output": "http://schemas.taskcluster.net/hooks/v1/list-hooks-response.json"
    },
    {
      "type": "function",
      "method": "get",
      "route": "/hooks/<hookGroupId>/<hookId>",
      "args": [
        "hookGroupId",
        "hookId"
      ],
      "name": "hook",
      "stability": "experimental",
      "title": "Get hook definition",
      "description": "This endpoint will return the hook defintion for the given `hookGroupId`\nand hookId.",
      "output": "http://schemas.taskcluster.net/hooks/v1/hook-definition.json"
    },
    {
      "type": "function",
      "method": "get",
      "route": "/hooks/<hookGroupId>/<hookId>/schedule",
      "args": [
        "hookGroupId",
        "hookId"
      ],
      "name": "getHookSchedule",
      "stability": "experimental",
      "title": "Get hook schedule",
      "description": "This endpoint will return the schedule and next scheduled creation time\nfor the given hook.",
      "output": "http://schemas.taskcluster.net/hooks/v1/hook-schedule.json"
    },
    {
      "type": "function",
      "method": "put",
      "route": "/hooks/<hookGroupId>/<hookId>",
      "args": [
        "hookGroupId",
        "hookId"
      ],
      "name": "createHook",
      "stability": "experimental",
      "title": "Create a hook",
      "description": "This endpoint will create a new hook.\n\nThe caller's credentials must include the role that will be used to\ncreate the task.  That role must satisfy task.scopes as well as the\nnecessary scopes to add the task to the queue.",
      "scopes": [
        [
          "hooks:modify-hook:<hookGroupId>/<hookId>",
          "assume:hook-id:<hookGroupId>/<hookId>"
        ]
      ],
      "input": "http://schemas.taskcluster.net/hooks/v1/create-hook-request.json",
      "output": "http://schemas.taskcluster.net/hooks/v1/hook-definition.json"
    },
    {
      "type": "function",
      "method": "post",
      "route": "/hooks/<hookGroupId>/<hookId>",
      "args": [
        "hookGroupId",
        "hookId"
      ],
      "name": "updateHook",
      "stability": "experimental",
      "title": "Update a hook",
      "description": "This endpoint will update an existing hook.  All fields except\n`hookGroupId` and `hookId` can be modified.",
      "scopes": [
        [
          "hooks:modify-hook:<hookGroupId>/<hookId>",
          "assume:hook-id:<hookGroupId>/<hookId>"
        ]
      ],
      "input": "http://schemas.taskcluster.net/hooks/v1/create-hook-request.json",
      "output": "http://schemas.taskcluster.net/hooks/v1/hook-definition.json"
    },
    {
      "type": "function",
      "method": "delete",
      "route": "/hooks/<hookGroupId>/<hookId>",
      "args": [
        "hookGroupId",
        "hookId"
      ],
      "name": "removeHook",
      "stability": "experimental",
      "title": "Delete a hook",
      "description": "This endpoint will remove a hook definition.",
      "scopes": [
        [
          "hooks:modify-hook:<hookGroupId>/<hookId>"
        ]
      ]
    }
  ]
};
