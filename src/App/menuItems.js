import React from 'react';
import { FontIcon, ListItem, Subheader } from 'react-md';

export default [
  <Subheader key="taskcluster-heading" primaryText="Taskcluster" inset />,
  {
    key: 'taskcluster-documentation',
    primaryText: 'Documentation',
    leftIcon: <FontIcon>local_library</FontIcon>,
    nestedItems: [
      <ListItem
        key="taskcluster-tutorial"
        leftIcon={<FontIcon>accessibility</FontIcon>}
        primaryText="Tutorial"
      />,
      <ListItem
        key="taskcluster-manual"
        leftIcon={<FontIcon>toc</FontIcon>}
        primaryText="Manual"
      />,
      <ListItem
        key="taskcluster-reference"
        leftIcon={<FontIcon>chrome_reader_mode</FontIcon>}
        primaryText="Reference"
      />,
      <ListItem
        key="taskcluster-resources"
        leftIcon={<FontIcon>help_outline</FontIcon>}
        primaryText="Resources"
      />,
      <ListItem
        key="taskcluster-people"
        leftIcon={<FontIcon>person_pin</FontIcon>}
        primaryText="People"
      />
    ]
  },
  {
    key: 'taskcluster-task-groups',
    primaryText: 'Task Groups',
    leftIcon: <FontIcon>group_work</FontIcon>
  },
  {
    key: 'taskcluster-tasks',
    active: true,
    defaultVisible: true,
    primaryText: 'Tasks',
    leftIcon: <FontIcon>play_for_work</FontIcon>,
    nestedItems: [
      <ListItem
        key="taskcluster-create-task"
        leftIcon={<FontIcon>add_circle_outline</FontIcon>}
        primaryText="Create task"
      />,
      <ListItem
        key="taskcluster-task-details"
        leftIcon={<FontIcon>details</FontIcon>}
        primaryText="Details"
      />,
      <ListItem
        key="taskcluster-task-runs"
        leftIcon={<FontIcon>format_list_numbered</FontIcon>}
        primaryText="Runs"
        nestedItems={[
          <ListItem
            key="taskcluster-task-run-logs"
            leftIcon={<FontIcon>description</FontIcon>}
            primaryText="Logs"
          />,
          <ListItem
            key="taskcluster-task-run-artifacts"
            leftIcon={<FontIcon>attachment</FontIcon>}
            primaryText="Artifacts"
          />
        ]}
      />
    ]
  },
  {
    key: 'taskcluster-provisioners',
    primaryText: 'Provisioners',
    leftIcon: <FontIcon>cloud_queue</FontIcon>
  },
  {
    key: 'taskcluster-workers',
    primaryText: 'Workers',
    leftIcon: <FontIcon>assignment</FontIcon>
  },
  {
    key: 'taskcluster-authentication',
    primaryText: 'Authentication',
    leftIcon: <FontIcon>perm_identity</FontIcon>,
    nestedItems: [
      <ListItem
        key="taskcluster-authentication-clients"
        leftIcon={<FontIcon>add_circle_outline</FontIcon>}
        primaryText="Clients"
      />,
      <ListItem
        key="taskcluster-authentication-roles"
        leftIcon={<FontIcon>web_asset</FontIcon>}
        primaryText="Roles"
      />,
      <ListItem
        key="taskcluster-authentication-scopes"
        leftIcon={<FontIcon>attachment</FontIcon>}
        primaryText="Scopes"
      />
    ]
  },
  {
    key: 'taskcluster-pulse-exchanges',
    primaryText: 'Pulse exchanges',
    leftIcon: <FontIcon>message</FontIcon>
  },
  {
    key: 'taskcluster-purge-caches',
    primaryText: 'Purge Caches',
    leftIcon: <FontIcon>delete</FontIcon>
  },
  {
    key: 'taskcluster-indexed-tasks',
    primaryText: 'Indexed Tasks',
    leftIcon: <FontIcon>low_priority</FontIcon>
  },
  {
    key: 'taskcluster-indexed-artifacts',
    primaryText: 'Indexed Artifacts',
    leftIcon: <FontIcon>attachment</FontIcon>
  },
  {
    key: 'taskcluster-hooks',
    primaryText: 'Hooks',
    leftIcon: <FontIcon>compare_arrows</FontIcon>
  },
  {
    key: 'taskcluster-secrets',
    primaryText: 'Secrets',
    leftIcon: <FontIcon>lock_outline</FontIcon>
  }
];
