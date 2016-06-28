import format from '../../lib/format';
import * as bs from 'react-bootstrap';
import React from 'react';
import taskcluster from 'taskcluster-client';

// All of the application uses this queue and queueEvents
export const queue = new taskcluster.Queue();
export const queueEvents = new taskcluster.QueueEvents();

export const webListener = () => {
  
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
        onMessageAction();
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



