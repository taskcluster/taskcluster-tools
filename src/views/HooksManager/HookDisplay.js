import React from 'react';
import { string, object, func } from 'prop-types';
import { ButtonToolbar, Button, Glyphicon } from 'react-bootstrap';
import HookStatusDisplay from './HookStatusDisplay';
import Code from '../../components/Code';
import Markdown from '../../components/Markdown';

export default class HookDisplay extends React.PureComponent {
  static propTypes = {
    hookId: string.isRequired,
    hookGroupId: string.isRequired,
    hook: object.isRequired,
    startEditing: func.isRequired
  };

  render() {
    const { hook, hookGroupId, hookId, hookStatus, refreshHookStatus, startEditing, triggerHook } = this.props;

    return (
      <div>
        <dl className="dl-horizontal">
          <dt>HookGroupId</dt>
          <dd><code>{hookGroupId}</code></dd>
          <dt>HookId</dt>
          <dd><code>{hookId}</code></dd>
        </dl>
        <dl className="dl-horizontal">
          <dt>Name</dt>
          <dd>{hook.metadata.name}</dd>
          <dt>Description</dt>
          <dd><Markdown>{hook.metadata.description}</Markdown></dd>
          <dt>Owner</dt>
          <dd>{hook.metadata.owner}</dd>
          <dt>Email On Error?</dt>
          <dd>{JSON.stringify(hook.metadata.emailOnError)}</dd>
        </dl>
        <dl className="dl-horizontal">
          <dt>Schedule</dt>
          <dd>
            {
              hook.schedule.length ?
                (
                  <ul className="hookSchedule" style={{ marginBottom: 0 }}>
                    {hook.schedule.map((schedule, key) => (
                      <li key={`hook-schedule-${key}`}>{schedule}</li>
                    ))}
                  </ul>
                ) :
                <span>(no schedule)</span>
            }
          </dd>
        </dl>
        <dl className="dl-horizontal">
          <dt>Task Expires</dt>
          <dd>{hook.expires} after creation</dd>
          <dt>Task Deadline</dt>
          <dd>{hook.deadline} after creation</dd>
        </dl>
        <HookStatusDisplay
          hookGroupId={hookGroupId}
          hookId={hookId}
          hookStatus={hookStatus}
          refreshHookStatus={refreshHookStatus} />
        <dl className="dl-horizontal">
          <dt>Task Definition</dt>
          <dd />
        </dl>
        <Code language="json">
          {JSON.stringify(hook.task, null, 2)}
        </Code>
        <ButtonToolbar>
          <Button bsStyle="success" onClick={startEditing}>
            <Glyphicon glyph="pencil" /> Edit Hook
          </Button>
          <Button bsStyle="success" onClick={triggerHook}>
            <Glyphicon glyph="repeat" /> Trigger Hook
          </Button>
        </ButtonToolbar>
      </div>
    );
  }
}
