import format from '../../lib/format';
import * as bs from 'react-bootstrap';
import React from 'react';
import taskcluster from 'taskcluster-client';


export const webListener = () => {
  
  const queue = new taskcluster.Queue(),
        queueEvents = new taskcluster.QueueEvents();

  let listener = new taskcluster.WebListener();
  return {
    startListening : (taskGroupId, onMessageAction) => {
      listener.bind(queueEvents.taskPending({
        taskGroupId: taskGroupId
      }));
      listener.bind(queueEvents.taskCompleted({
        taskGroupId: taskGroupId
      }));

      listener.on("message", (message) => {
        console.log('MESSAGE: ', message.payload.status);
        onMessageAction(taskGroupId);
        //  message.payload.status is the only property that is consistent across all exchanges
        //  message.payload.task never changes because its the task definition
        //  updateReduxStore();
      });

      listener.on("error", function(err) {
        console.log('ERROR: ', err);
        //  Perhaps display an error banner on top of the dashboard. This happens when a user puts him laptop to sleep
        //  A smart way is to restart listening from scratch.
        //  If you reconnect, make sure there is a limit. if more than 5 times in the 5 min interval, then stop reconnecting.
      });

      listener.resume();

    },

    stopListening : () => {
      listener.close();
    }  

  }
  

}

export const rendering =  {
  renderError: (err) => {
    // Find some sort of summary or error code
    let code = err.code + ' Error!';
    if (!err.code && err.statusCode) {
      code = 'HTTP ' + err.statusCode;
    }
    code = code || 'Unknown Error';

    // Find some sort of message
    let message = err.message || '```\n' + err.stack + '\n```';

    let title = <bs.Button bsStyle="link">Additional details...</bs.Button>;
    return (
      <bs.Alert bsStyle="danger">
          <strong>
            {code}&nbsp;
          </strong>
          <format.Markdown>{message}</format.Markdown>
          <format.Collapse title={title}>
            <pre>
              {JSON.stringify(err.body, null, 2)}
            </pre>
          </format.Collapse>
        </bs.Alert>
    );
  }
}



