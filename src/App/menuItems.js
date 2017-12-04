export default [
  {
    key: 'taskcluster-heading',
    primaryText: 'Taskcluster',
    header: true
  },
  {
    primaryText: 'Documentation',
    icon: 'local_library',
    key: 'taskcluster-documentation',
    nestedItems: [
      {
        key: 'taskcluster-tutorial',
        primaryText: 'Tutorial',
        to: '/test',
        icon: 'accessibility'
      },
      {
        key: 'taskcluster-reference',
        icon: 'chrome_reader_mode',
        to: '/test2',
        primaryText: 'Reference'
      },
      {
        key: 'taskcluster-resources',
        icon: 'help_outline',
        primaryText: 'Resources'
      },
      {
        key: 'taskcluster-people',
        icon: 'person_pin',
        primaryText: 'People'
      }
    ]
  },
  {
    key: 'taskcluster-tasks',
    defaultVisible: true,
    primaryText: 'Tasks',
    icon: 'play_for_work',
    nestedItems: [
      {
        key: 'taskcluster-create-task',
        icon: 'add_circle_outline',
        to: '/tasks/create',
        primaryText: 'Create task'
      },
      {
        key: 'taskcluster-task-groups',
        icon: 'group_work',
        to: '/groups',
        primaryText: 'Inspect task(s)'
      }
    ]
  },
  {
    key: 'taskcluster-entities',
    defaultVisible: true,
    primaryText: 'Provisioners',
    icon: 'cloud_queue',
    nestedItems: [
      {
        key: 'taskcluster-provisioners',
        icon: 'assignment',
        to: '/provisioners',
        primaryText: 'Provisioners'
      },
      {
        key: 'taskcluster-aws-provisioner',
        icon: 'cloud',
        to: '/aws-provisioner',
        primaryText: 'AWS Provisioner'
      },
      {
        key: 'taskcluster-cache-purge',
        icon: 'delete',
        to: '/pulse-caches',
        primaryText: 'Purge Caches'
      }
    ]
  },
  {
    key: 'taskcluster-authentication',
    primaryText: 'Authentication',
    icon: 'perm_identity',
    nestedItems: [
      {
        key: 'taskcluster-authentication-clients',
        icon: 'add_circle_outline',
        to: '/auth/clients',
        primaryText: 'Client Manager'
      },
      {
        key: 'taskcluster-authentication-roles',
        icon: 'web_asset',
        to: '/auth/roles',
        primaryText: 'Role Manager'
      },
      {
        key: 'taskcluster-authentication-scopes',
        icon: 'find_in_page',
        to: '/auth/scopes',
        primaryText: 'Scope Inspector'
      },
      {
        key: 'taskcluster-authentication-grants',
        icon: 'add_to_queue',
        to: '/auth/grants',
        primaryText: 'Scope Grants'
      }
    ]
  },
  {
    key: 'taskcluster-core-services',
    primaryText: 'Core Services',
    icon: 'fiber_manual_record',
    nestedItems: [
      {
        key: 'taskcluster-hooks',
        icon: 'compare_arrows',
        to: '/hooks',
        primaryText: 'Hooks'
      },
      {
        key: 'taskcluster-secrets',
        icon: 'lock_outline',
        to: '/secrets',
        primaryText: 'Secrets'
      },
      {
        key: 'taskcluster-indexed-tasks',
        icon: 'low_priority',
        to: '/index',
        primaryText: 'Indexed Tasks'
      },
      {
        key: 'taskcluster-indexed-artifacts',
        icon: 'attachment',
        to: '/index/artifacts',
        primaryText: 'Indexed Artifacts'
      }
    ]
  },
  {
    key: 'taskcluster-pulse-exchanges',
    primaryText: 'Pulse exchanges',
    to: '/pulse-inspector',
    icon: 'message'
  }
];
