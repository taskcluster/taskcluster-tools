import React from 'react';
import { ListItem } from 'react-md';

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
      <ListItem
        key="taskcluster-tutorial"
        icon="accessibility"
        primaryText="Tutorial"
        to="/test"
      />,
      <ListItem key="taskcluster-manual" icon="toc" primaryText="Manual" />,
      <ListItem
        key="taskcluster-reference"
        icon="chrome_reader_mode"
        primaryText="Reference"
        to="/test2"
      />,
      <ListItem
        key="taskcluster-resources"
        icon="help_outline"
        primaryText="Resources"
      />,
      <ListItem
        key="taskcluster-people"
        icon="person_pin"
        primaryText="People"
      />
    ]
  },
  {
    key: 'taskcluster-tasks',
    defaultVisible: true,
    primaryText: 'Tasks',
    icon: 'play_for_work',
    nestedItems: [
      <ListItem
        key="taskcluster-create-task"
        icon="add_circle_outline"
        to="/tasks/create"
        primaryText="Create task"
      />,
      <ListItem
        key="taskcluster-task-groups"
        icon="group_work"
        to="/groups"
        primaryText="Inspect Task(s)"
      />
    ]
  },
  {
    key: 'taskcluster-entities',
    defaultVisible: true,
    primaryText: 'Provisioners',
    icon: 'cloud_queue',
    nestedItems: [
      <ListItem
        key="taskcluster-provisioners"
        icon="assignment"
        to="/provisioners"
        primaryText="Provisioners"
      />,
      <ListItem
        key="taskcluster-aws-provisioner"
        icon="cloud"
        to="/aws-provisioner"
        primaryText="AWS Provisioner"
      />,
      <ListItem
        key="taskcluster-cache-purge"
        icon="delete"
        to="/pulse-caches"
        primaryText="Purge Caches"
      />
    ]
  },
  {
    key: 'taskcluster-authentication',
    primaryText: 'Authentication',
    icon: 'perm_identity',
    nestedItems: [
      <ListItem
        key="taskcluster-authentication-clients"
        icon="add_circle_outline"
        to="/auth/clients"
        primaryText="Client Manager"
      />,
      <ListItem
        key="taskcluster-authentication-roles"
        icon="web_asset"
        to="/auth/roles"
        primaryText="Role Manager"
      />,
      <ListItem
        key="taskcluster-authentication-scopes"
        icon="find_in_page"
        to="/auth/scopes"
        primaryText="Scope Inspector"
      />,
      <ListItem
        key="taskcluster-authentication-scope-grants"
        icon="add_to_queue"
        to="/auth/scopes"
        primaryText="Scope Grants"
      />
    ]
  },
  {
    key: 'taskcluster-indexed',
    primaryText: 'Indexed',
    icon: 'bookmark_border',
    nestedItems: [
      <ListItem
        key="taskcluster-indexed-tasks"
        icon="low_priority"
        to="/index"
        primaryText="Tasks"
      />,
      <ListItem
        key="taskcluster-indexed-artifacts"
        icon="attachment"
        to="/index/artifacts"
        primaryText="Artifacts"
      />
    ]
  },
  {
    key: 'taskcluster-pulse-exchanges',
    primaryText: 'Pulse exchanges',
    to: '/pulse-inspector',
    icon: 'message'
  },
  {
    key: 'taskcluster-hooks',
    primaryText: 'Hooks',
    to: '/hooks',
    icon: 'compare_arrows'
  },
  {
    key: 'taskcluster-secrets',
    primaryText: 'Secrets',
    to: '/secrets',
    icon: 'lock_outline'
  }
];
