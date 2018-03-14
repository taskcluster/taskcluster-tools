---
title: Action Specification
---

This document specifies how actions exposed by the *[decision
task](/docs/manual/using/task-graph)* are to be presented and triggered from
Treeherder, or similar user interfaces.

The *decision task* creates an artifact `public/actions.json` to be consumed by
a user interface such as Treeherder. The `public/actions.json` file specifies
the available actions.

Through the `public/actions.json` file it is possible expose actions
defined in-tree such that the actions can be conveniently triggered in
a user interface tool such as Treeherder. This has two purposes:

1.  Facilitate development of utility actions/tools in-tree, and,
2.  Strongly decouple build/test configuration from Treeherder.

For details on how define custom actions in-tree, refer to
the in-tree actions section. This document merely
specifies how `actions.json` shall be interpreted.

## Actions

The content of `actions.json` is a list of actions (and variables, to be
described later). Each action has a `kind` describing how a user
interface should trigger it. There is currently only one kind defined:
`task`.

An action with `kind: 'task'` specifies a task that the user interface
should create. That is, when the action is triggered, the user interface
calls the Taskcluster API to create a new task, with the content of that
task determined from `actions.json`.

The task created by the action may be useful in its own right (for
example, running a test with additional debugging), or it may simplify
trigger in-tree scripts that create new tasks. The latter form is called
an *action task*, and is similar to a decision task. This allows in-tree
scripts to execute complicated actions such as backfilling.

Actions of the `'task'` *kind* **must** have a `task` property. This
property specifies the task template to be parameterized and created in
order to trigger the action.

The template is parameterized using
[JSON-e](https://github.com/taskcluster/json-e), with the following
context entries available:

`taskGroupId`:   the `taskGroupId` of task-group this is triggered from,

`taskId`:   the `taskId` of the selected task, `null` if no task is selected
    (this is the case if the action has `context: []`),

`task`:   the task definition of the selected task, `null` if no task is
    selected (this is the case if the action has `context: []`), and,

`ownTaskId`:   the `taskId` of the action task itself. This is useful for
    indexing without collisions and other similar needs

`input`:   the input matching the `schema` property, `null` if the action
    doesn't have a `schema` property. See "Action Input" below.

`<key>`:   Any `<key>` defined in the `variables` property may also be
    referenced. See "Variables" below.

The following **example** demonstrates how a task template can specify
timestamps and dump input JSON into environment variables:

```json
{
  "version": 1,
  "actions": [
    {
      "kind": "task",
      "name": "thing",
      "title": "Do A Thing",
      "description": "Do something",
      "task": {
        "workerType": "my-worker",
        "payload": {
          "created": {"$fromNow": ""},
          "deadline": {"$fromNow": "1 hour 15 minutes"},
          "expiration": {"$fromNow": "14 days"},
          "image": "my-docker-image",
          "env": {
            "TASKID_TRIGGERED_FOR": "${taskId}",
            "INPUT_JSON": {"$json": {"$eval": "input"}}
          },
          ...
        },
        ...
      }
    }
  ],
  "variables": {}
}
```

### Metadata

Each action entry must define a `name`, `title` and `description`.
furthermore, the list of actions should be sorted by the order in which
actions should appear in a menu.

The `name` is used by user interfaces to identify the action. For
example, a retrigger button might look for an action with
name = "retrigger".

Action names must be unique for a given task, or for a taskgroup, but
the same name may be used for actions applying to disjoint sets of
tasks. For example, it may be helpful to define different "retrigger"
actions for build tasks \[{jobKind: 'build'}\] and test tasks
\[{jobKind: 'test'}\], and in this case only one such action would apply
to any given task.

The `title` is a human readable string intended to be used as label on
the button, link or menu entry that triggers the action. This should be
short and concise. Ideally, you'll want to avoid duplicates.

The `description` property contains a human readable string describing
the action, such as what it does, how it does it, what it is useful for.
This string is to be render as **markdown**, allowing for bullet points,
links and other simple formatting to explain what the action does.

### Action Context

Few actions are relevant in all contexts. For this reason each action
specifies a `context` property. This property specifies when an action
is relevant. Actions *relevant* for a task should be displayed in a
context menu for the given task. Similarly actions *not relevant* for a
given task should not be displayed in the context menu for the given
task.

As a special case we say that actions for which *no relevant* contexts
can exist, are *relevant* for the task-group. This could for example be
an action to create tasks that was optimized away.

The `context` property is specified as a list of *tag-sets*. A *tag-set*
is a set of key-value pairs. A task is said to *match* a *tag-set* if
`task.tags` is a super-set of the *tag-set*. An action is said to be
*relevant* for a given task, if `task.tags` *match* one of the
*tag-sets* given in the `context` property for the action.

Naturally, it follows that an action with an empty list of *tag-sets* in
its `context` property cannot possibly be *relevant* for any task.
Hence, by previously declared special case such an action is *relevant*
for the task-group.

**Examples**:

```js
// Example task definitions (everything but tags eclipsed)
TaskA = {..., tags: {kind: 'test', platform: 'linux'}}
TaskB = {..., tags: {kind: 'test', platform: 'windows'}}
TaskC = {..., tags: {kind: 'build', platform: 'linux'}}

Action1 = {..., context: [{kind: 'test'}]}
// Action1 is relevant to: TaskA, TaskB

Action2 = {..., context: [{kind: 'test', platform: 'linux'}]}
// Action2 is relevant to: TaskA

Action3 = {..., context: [{platform: 'linux'}]}
// Action3 is relevant to: TaskA, TaskC

Action4 = {..., context: [{kind: 'test'}, {kind: 'build'}]}
// Action4 is relevant to: TaskA, TaskB, TaskC

Action5 = {..., context: [{}]}
// Action5 is relevant to: TaskA, TaskB, TaskC (all tasks in fact)

Action6 = {..., context: []}
// Action6 is relevant to the task-group
```

### Action Input

An action can take JSON input, the input format accepted by an action is
specified using a [JSON schema](http://json-schema.org/). This schema is
specified with by the action's `schema` property. For example:

```json
{
  "version": 1,
  "actions": [
    {
      "kind": "task",
      "name": "thing",
      "title": "Do A Thing",
      "description": "Do something",
      "schema": {
        "description": "The thing to do",
        "title": "Thing",
        "default": "something",
        "type": "string",
        "maxLength": 255
      },
      "task": {
        "payload": {
          "env": {
            "INPUT_JSON": {"$json": {"$eval": "input"}}
          },
          ...
        },
        ...
      }
    }
  ],
  "variables": {}
}
```

User interfaces for triggering actions, like Treeherder, are expected to
provide JSON input that satisfies this schema. These interfaces are also
expected to validate the input against the schema before attempting to
trigger the action.

It is perfectly legal to reference external schemas using constructs
like `{"$ref": "https://example.com/my-schema.json"}`, in this case it
however strongly recommended that the external resource is available
over HTTPS and allows CORS requests from any source.

When writing schemas it is strongly encouraged that the JSON schema
`description` properties are used to provide detailed descriptions. It
is assumed that consumers will render these `description` properties as
markdown.

## Variables

The `public/actions.json` artifact has a `variables` property that is a
mapping from variable names to JSON values to be used as constants.
These variables can be referenced from task templates, but beware that
they may overshadow builtin variables. This is mainly useful to
deduplicate commonly used values, in order to reduce template size. This
feature does not introduce further expressiveness.

## Formal Specification

The JSON Schema for `actions.json` is as follows:.

```yaml
$schema: http://json-schema.org/draft-04/schema#
id: https://docs.taskcluster.net/manual/tasks/actions/schema.yml
title: Schema for Exposing Actions
description: |
  This document specifies the schema for the `public/actions.json` used by
  _decision tasks_ to expose actions that can be triggered by end-users.

  For the purpose of this document the _consumer_ is the user-interface that
  displays task results to the end-user and allows end-users to trigger actions
  defined by `public/actions.json`. A _consumer_ might be Treeherder.
  The _end-user_ is a developer who is inspecting the results, and wish to
  trigger actions.
type: object
properties:
  version:
    enum: [1]
    type: integer
  variables:
    type: object
    description: |
      Mapping from variable name to constants that can be referenced using
      `{$eval: '<variable>'}` within the task templates defined for each action.

      This is useful for commonly used constants that are used in many task
      templates. Whether it's to reduce the size of the `public/actions.json`
      artifact by reuseing large constants, or simply to make it easier to
      write task templates by exposing additional variables.

      These will overwrite any builtin variables, such as `taskGroupId`,
      `input`, `taskId`, `task`, and any further variables that future
      backwards compatible iterations of this specifcation adds. Hence, you
      should avoid declaring variables such as `input`, as it will shadow the
      builtin `input` variable.
    additionalProperties: true
  actions:
    type: array
    description: |
      List of actions that can be triggered.
    items:
      type: object
      properties:
        name:
          type: string
          maxLength: 255
          description: |
            The name of this action.  This is used by user interfaces to
            identify the action. For example, a retrigger button might look for
            an action with `name = "retrigger"`.

            Action names must be unique for a given task, or for a taskgroup,
            but the same name may be used for actions applying to disjoint sets
            of tasks. For example, it may be helpful to define different
            "retrigger" actions for build tasks `[{jobKind: 'build'}]` and test
            tasks `[{jobKind: 'test'}]`, and in this case only one such action
            would apply to any given task.
        title:
          type: string
          maxLength: 255
          description: |
            Title text to be displayed on the button or link triggering the action.
        description:
          type: string
          maxLength: 4096
          description: |
            Human readable description of the action in markdown.
            Can be displayed in tooltip, popup and/or dialog when triggering
            the action.
        kind:
          enum:
            - task
          description: |
            Specifies the kind of action this is.

            The `task` _action kind_ is triggered by creating a task, following
            a task template.

            Other kinds might be added in the future. Consumers should ignore
            all entries featuring a `kind` property they don't recognize.
        context:
          type: array
          default: []
          items:
            type: object
            additionalProperties:
              type: string
              maxLength: 4096
            title: tag-set
            description: |
              A set of key-value pairs specifying a _tag-set_.
          description: |
            The `context` property determines in what context the action is
            relevant. Thus, what context the action should be presented to the
            end-user.

            The `context` property contains a set of tag-sets. A _tag-set_ is a
            set of key-value pairs. A task is said satisfy a tag-set if
            `task.tags` is a super-set of the given tag-set. An action is
            relevant for a task if the task satisfies at-least one of
            the tag-sets.

            Hence, an action with `context: [{a: '1'}, {b: '2'}]` is relevant
            for any task with `task.tags.a = '1'` or `task.tags.b = '2'`.
            An action with `context: [{a: '1', b: '2'}]` is only relevant for
            tasks with `task.tags.a = '1'` and `task.tags.b = '2'`.

            This allows restrictions of what tasks an action is relevant for.
            For example some tasks might not support running under a debugger.

            The keen reader observes that actions with `context: [{}]` are
            relevant for all tasks. Conversely, we have that tasks with
            `context: []` are irrelevant for all tasks. We abuse this property
            and define actions with `context: []` to be relevant for the
            _task-group_ only.

            That is an action with `context: []` should not be display in the
            context-sensitive menu for a task, rather it should be display when
            selecting the entire task-group. Presentation details are left for
            consumer to decide.

            Notice that the `context` property is optional, but defined to have
            a default value `context: []`. Hence, if the `context` is not
            specified consumer should take this to mean `context: []` implying
            that the action is relevant to the task-group, rather than any
            subset of tasks.
        schema:
          $ref: http://json-schema.org/schema
          description: |
            JSON schema for input parameters to the `task` template property.
            Consumers shall offer a user-interface where end-users can enter
            values that satisfy this schema. Furthermore, consumers **must**
            validate enter values against the given schema before parameterizing
            the `task` template property and triggering the action.

            In practice it's encourage that consumers employ a facility that
            can generate HTML forms from JSON schemas. However, if certain
            schemas are particularly complicated or common, consumers may also
            hand-write a user-interface for collecting the input. In this case
            the consumer **must** do a deep comparison between the schema given
            in the action, and the schema for which a custom user-interface have
            been written, and fall-back to an auto-generated form if the schema
            doesn't match.

            It is assumed that the JSON schema `description` property will be
            rendered as markdown when displayed as documentation for end-users.
            Producers of `public/actions.json` is encouraged to provide a
            detailed explanation of the input parameters using these
            `description` properties. And consumers are *strongly* encouraged
            to render `description` values as markdown.

            The `schema` property is optional, and if not given the input for
            `task` template parameterization shall be `null`.
        task:
          type: object
          title: task template
          description: |
            Task template for triggering the action.

            When an action have been selected in the appropriate context and
            input satisfying the `schema` (if any) has been collected. The
            action is triggered by parameterizing the task template given in
            this property, and creating the resulting task.

            The template is an object that is parameterized using
            [JSON-e](https://github.com/taskcluster/json-e), with the above
            variables supplied as context.

            This allows for dumping `input` and `taskId` into environment
            variables for the task to be created. 
      additionalProperties: false
      required:
        - title
        - description
        - kind
        - task
additionalProperties: false
required:
  - version
  - actions
  - variables
```
