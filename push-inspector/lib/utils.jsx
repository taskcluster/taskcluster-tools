import format from '../../lib/format';
import * as bs from 'react-bootstrap';
import React from 'react';
import taskcluster from 'taskcluster-client';
import _ from 'lodash';

export const queue = new taskcluster.Queue({
    credentials: JSON.parse(localStorage.credentials)
});

export const queueEvents = new taskcluster.QueueEvents();

export const webListener = () => {  
  
  let listener = new taskcluster.WebListener();

  return {
    startListening : (taskGroupId, onMessageAction) => {
      let qkey = { taskGroupId: taskGroupId};
      
      listener.bind(queueEvents.taskDefined(qkey));
      listener.bind(queueEvents.taskPending(qkey));
      listener.bind(queueEvents.taskRunning(qkey));
      listener.bind(queueEvents.artifactCreated(qkey));
      listener.bind(queueEvents.taskCompleted(qkey));
      listener.bind(queueEvents.taskFailed(qkey));
      listener.bind(queueEvents.taskException(qkey));

      
      listener.on("message", (message) => {
        console.log('MESSAGE: ', message.payload.status);
        onMessageAction(message);
      });

    
      // Display error banner on top of dashboard
      // happens when a user goes to sleep
      // Logical way is to restart listening from scratch
      // If you reconnect, make sure the is a limit.
      // If more than 5 times in the 5 min interval
      // then stop reconnection
      listener.on("error", function(err) {
        console.log('ERROR Listener: ', err);
      });

      listener.resume();

    },

    stopListening : () => {
      listener.close();
    }  

  };

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
  },

  renderSuccess(message) {
    return (
      <bs.Alert bsStyle="success">
        {message}   
      </bs.Alert>
    )
  }
}

export const beautify = {

  labelClassName(state) {
    let cl = "my-label";
    if (state == 'completed') {
      return cl + " label-completed";
    } else if (state == 'failed') {
      return cl + " label-failed";
    } else if (state == "exception") {
      return cl + " label-exception";
    } else if (state =="unscheduled") {
      return cl + " label-unscheduled";
    } else if (state =="pending") {
      return cl + " label-pending";
    } else if (state =="running") {
      return cl + " label-running";
    }
  }
}





