import format from '../../lib/format';
import * as bs from 'react-bootstrap';
import React from 'react';
import taskcluster from 'taskcluster-client';

/**
* Creation of queue. If credentials are available, we use them at the start of the application
*/
export let queue;
if(localStorage.credentials) {
  queue = new taskcluster.Queue({
    credentials: JSON.parse(localStorage.credentials)
  });
} else{
  queue = new taskcluster.Queue();
}

/**
* Creation of queueEvents
*/
export const queueEvents = new taskcluster.QueueEvents();

/**
* Authentication
*/
export const authentication = {
  login: (credentials) => {
    queue = new taskcluster.Queue({credentials});
  }
}

/**
* WebListener
* Setup bindings and event callbacks
*/
let listener = new taskcluster.WebListener();
export const webListener =  {  
  
  startListening: (taskGroupId, onMessageAction) => {
    let qkey = { taskGroupId: taskGroupId};
    
    listener.bind(queueEvents.taskDefined(qkey));
    listener.bind(queueEvents.taskPending(qkey));
    listener.bind(queueEvents.taskRunning(qkey));
    listener.bind(queueEvents.artifactCreated(qkey));
    listener.bind(queueEvents.taskCompleted(qkey));
    listener.bind(queueEvents.taskFailed(qkey));
    listener.bind(queueEvents.taskException(qkey));

    listener.on("message", (message) => {        
      console.log('Message: ', message.payload.status);
      onMessageAction(message);
    });

    listener.on("error", function(err) {
      console.error('Error within the Listener: ', err);
      if (!err) {
          err = new Error("Unknown error");
      }
      listener.close();
      // Show a banner
      onMessageAction(err);
    });

    listener.resume();
  },

  // Stop listening and create a new instance for the next listener
  stopListening: () => {
    listener.close();
    listener = new taskcluster.WebListener();
  }  

}

/**
* Rendering Erorr and Success messages
*/
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

  renderSuccess: (message) => {
    return (
      <bs.Alert bsStyle="success">
        {message}   
      </bs.Alert>
    )
  }
}

/**
* Beautify functions
*/
export const beautify = {

  labelClassName: (state) => {
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

/**
* Push notifications
*/
export const notifications = {
  notifyUser: (message) => {
    let e = new Notification(message);
  },
  requestPermission: () => {
    Notification.requestPermission();
  }
}
