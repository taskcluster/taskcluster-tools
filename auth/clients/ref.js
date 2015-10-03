module.exports = {
  "version": 0,
  "$schema": "http://schemas.taskcluster.net/base/v1/api-reference.json#",
  "title": "Authentication API",
  "description": "Authentication related API end-points for taskcluster.",
  "baseUrl": "https://tc-auth-load-test.herokuapp.com/v1",
  "entries": [
    {
      "type": "function",
      "method": "get",
      "route": "/clients/",
      "args": [],
      "name": "listClients",
      "stability": "experimental",
      "title": "List Clients",
      "description": "**Will change when paging is added**",
      "output": "http://schemas.taskcluster.net/auth/v1/list-clients-response.json#"
    },
    {
      "type": "function",
      "method": "get",
      "route": "/clients/<clientId>",
      "args": [
        "clientId"
      ],
      "name": "client",
      "stability": "stable",
      "title": "Words...",
      "description": "Words...",
      "output": "http://schemas.taskcluster.net/auth/v1/get-client-response.json#"
    },
    {
      "type": "function",
      "method": "put",
      "route": "/clients/<clientId>",
      "args": [
        "clientId"
      ],
      "name": "createClient",
      "stability": "stable",
      "title": "Create Client",
      "description": "Words...",
      "scopes": [
        [
          "auth:create-client:<clientId>"
        ]
      ],
      "input": "http://schemas.taskcluster.net/auth/v1/create-client-request.json#",
      "output": "http://schemas.taskcluster.net/auth/v1/create-client-response.json#"
    },
    {
      "type": "function",
      "method": "post",
      "route": "/clients/<clientId>/reset",
      "args": [
        "clientId"
      ],
      "name": "resetAccessToken",
      "stability": "stable",
      "title": "Reset `accessToken`",
      "description": "Words...",
      "scopes": [
        [
          "auth:reset-access-token:<clientId>"
        ]
      ],
      "output": "http://schemas.taskcluster.net/auth/v1/create-client-response.json#"
    },
    {
      "type": "function",
      "method": "post",
      "route": "/clients/<clientId>",
      "args": [
        "clientId"
      ],
      "name": "updateClient",
      "stability": "stable",
      "title": "Update Client",
      "description": "Words...",
      "scopes": [
        [
          "auth:update-client:<clientId>"
        ]
      ],
      "input": "http://schemas.taskcluster.net/auth/v1/create-client-request.json#",
      "output": "http://schemas.taskcluster.net/auth/v1/get-client-response.json#"
    },
    {
      "type": "function",
      "method": "delete",
      "route": "/clients/<clientId>",
      "args": [
        "clientId"
      ],
      "name": "deleteClient",
      "stability": "stable",
      "title": "Delete Client",
      "description": "Words...",
      "scopes": [
        [
          "auth:delete-client:<clientId>"
        ]
      ]
    },
    {
      "type": "function",
      "method": "get",
      "route": "/roles/",
      "args": [],
      "name": "listRoles",
      "stability": "experimental",
      "title": "List Roles",
      "description": "**Will change when paging is added**",
      "output": "http://schemas.taskcluster.net/auth/v1/list-roles-response.json#"
    },
    {
      "type": "function",
      "method": "get",
      "route": "/roles/<roleId>",
      "args": [
        "roleId"
      ],
      "name": "role",
      "stability": "stable",
      "title": "Get Role",
      "description": "words...",
      "output": "http://schemas.taskcluster.net/auth/v1/get-role-response.json#"
    },
    {
      "type": "function",
      "method": "put",
      "route": "/roles/<roleId>",
      "args": [
        "roleId"
      ],
      "name": "createRole",
      "stability": "stable",
      "title": "Create Role",
      "description": "words...",
      "scopes": [
        [
          "auth:create-role:<roleId>"
        ]
      ],
      "input": "http://schemas.taskcluster.net/auth/v1/create-role-request.json#",
      "output": "http://schemas.taskcluster.net/auth/v1/get-role-response.json#"
    },
    {
      "type": "function",
      "method": "post",
      "route": "/roles/<roleId>",
      "args": [
        "roleId"
      ],
      "name": "updateRole",
      "stability": "stable",
      "title": "Update Role",
      "description": "words...",
      "scopes": [
        [
          "auth:update-role:<roleId>"
        ]
      ],
      "input": "http://schemas.taskcluster.net/auth/v1/create-role-request.json#",
      "output": "http://schemas.taskcluster.net/auth/v1/get-role-response.json#"
    },
    {
      "type": "function",
      "method": "delete",
      "route": "/roles/<roleId>",
      "args": [
        "roleId"
      ],
      "name": "deleteRole",
      "stability": "stable",
      "title": "Delete Role",
      "description": "words...",
      "scopes": [
        [
          "auth:delete-role:<roleId>"
        ]
      ]
    },
    {
      "type": "function",
      "method": "get",
      "route": "/aws/s3/<level>/<bucket>/<prefix>",
      "args": [
        "level",
        "bucket",
        "prefix"
      ],
      "name": "awsS3Credentials",
      "stability": "experimental",
      "title": "Get Temporary Read/Write Credentials S3",
      "description": "Get temporary AWS credentials for `read-write` or `read-only` access to\na given `bucket` and `prefix` within that bucket.\nThe `level` parameter can be `read-write` or `read-only` and determines\nwhich type of credentials are returned. Please note that the `level`\nparameter is required in the scope guarding access.\n\nThe credentials are set to expire after an hour, but this behavior is\nsubject to change. Hence, you should always read the `expires` property\nfrom the response, if you intend to maintain active credentials in your\napplication.\n\nPlease note that your `prefix` may not start with slash `/`. Such a prefix\nis allowed on S3, but we forbid it here to discourage bad behavior.\n\nAlso note that if your `prefix` doesn't end in a slash `/`, the STS\ncredentials may allow access to unexpected keys, as S3 does not treat\nslashes specially.  For example, a prefix of `my-folder` will allow\naccess to `my-folder/file.txt` as expected, but also to `my-folder.txt`,\nwhich may not be intended.",
      "scopes": [
        [
          "auth:aws-s3:<level>:<bucket>/<prefix>"
        ]
      ],
      "output": "http://schemas.taskcluster.net/auth/v1/aws-s3-credentials-response.json#"
    },
    {
      "type": "function",
      "method": "get",
      "route": "/azure/<account>/table/<table>/read-write",
      "args": [
        "account",
        "table"
      ],
      "name": "azureTableSAS",
      "stability": "stable",
      "title": "Get Shared-Access-Signature for Azure Table",
      "description": "Get a shared access signature (SAS) string for use with a specific Azure\nTable Storage table.  Note, this will create the table, if it doesn't\nalready exist.",
      "scopes": [
        [
          "auth:azure-table-access:<account>/<table>"
        ]
      ],
      "output": "http://schemas.taskcluster.net/auth/v1/azure-table-access-response.json#"
    },
    {
      "type": "function",
      "method": "post",
      "route": "/authenticate-hawk",
      "args": [],
      "name": "authenticateHawk",
      "stability": "stable",
      "title": "Authenticate Hawk Request",
      "description": "Validate the request signature given on input and return list of scopes\nthat the authenticating client has.\n\nThis method is used by other services that wish rely on TaskCluster\ncredentials for authentication. This way we can use Hawk without having\nthe secret credentials leave this service.",
      "input": "http://schemas.taskcluster.net/auth/v1/authenticate-hawk-request.json#",
      "output": "http://schemas.taskcluster.net/auth/v1/authenticate-hawk-response.json#"
    },
    {
      "type": "function",
      "method": "post",
      "route": "/import-clients",
      "args": [],
      "name": "importClients",
      "stability": "deprecated",
      "title": "Import Legacy Clients",
      "description": "Import client from JSON list, overwriting any clients that already\nexists. Returns a list of all clients imported.",
      "scopes": [
        [
          "auth:import-clients",
          "auth:create-client",
          "auth:credentials"
        ]
      ],
      "input": "http://schemas.taskcluster.net/auth/v1/exported-clients.json#"
    },
    {
      "type": "function",
      "method": "get",
      "route": "/ping",
      "args": [],
      "name": "ping",
      "stability": "experimental",
      "title": "Ping Server",
      "description": "Documented later...\n\n**Warning** this api end-point is **not stable**."
    }
  ]
};
