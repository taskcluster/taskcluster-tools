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
    key: 'taskcluster-task-groups',
    primaryText: 'Task Groups',
    to: '/groups',
    icon: 'group_work'
  },
  {
    key: 'taskcluster-tasks',
    active: true,
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
        key="taskcluster-task-details"
        icon="details"
        primaryText="Details"
      />,
      <ListItem
        key="taskcluster-task-runs"
        icon="format_list_numbered"
        primaryText="Runs"
        nestedItems={[
          <ListItem
            key="taskcluster-task-run-logs"
            icon="description"
            primaryText="Logs"
          />,
          <ListItem
            key="taskcluster-task-run-artifacts"
            icon="attachment"
            primaryText="Artifacts"
          />
        ]}
      />
    ]
  },
  {
    key: 'taskcluster-provisioners',
    primaryText: 'Provisioners',
    to: '/provisioners',
    icon: 'cloud_queue'
  },
  {
    key: 'taskcluster-workers',
    primaryText: 'Workers',
    icon: 'assignment'
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
        primaryText="Clients"
      />,
      <ListItem
        key="taskcluster-authentication-roles"
        icon="web_asset"
        to="/auth/roles"
        primaryText="Roles"
      />,
      <ListItem
        key="taskcluster-authentication-scopes"
        icon="attachment"
        to="/auth/scopes"
        primaryText="Scopes"
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
    key: 'taskcluster-purge-caches',
    primaryText: 'Purge Caches',
    to: '/pulse-caches',
    icon: 'delete'
  },
  {
    key: 'taskcluster-indexed-tasks',
    primaryText: 'Indexed Tasks',
    to: '/index',
    icon: 'low_priority'
  },
  {
    key: 'taskcluster-indexed-artifacts',
    primaryText: 'Indexed Artifacts',
    to: '/index/artifacts',
    icon: 'attachment'
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
