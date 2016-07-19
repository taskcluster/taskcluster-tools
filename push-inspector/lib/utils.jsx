import format from '../../lib/format';
import * as bs from 'react-bootstrap';
import React from 'react';
import taskcluster from 'taskcluster-client';

/**
* Creation of queue. If credentials are available, we use them at the start of the application
*/
export let queue = localStorage.credentials ? 
  new taskcluster.Queue({ credentials: JSON.parse(localStorage.credentials) }) :
  new taskcluster.Queue();

/**
* Creation of queueEvents
*/
export const queueEvents = new taskcluster.QueueEvents();

/**
* Authentication
*/
export const authentication = {
  login: (credentials) => {
    queue = new taskcluster.Queue({ credentials });
  }
};

/**
* WebListener
* Setup bindings and event callbacks
*/
let listener = new taskcluster.WebListener();

export const webListener = {  
  startListening: (taskGroupId, onMessageAction) => {
    const qkey = { taskGroupId: taskGroupId };
    
    listener.bind(queueEvents.taskDefined(qkey));
    listener.bind(queueEvents.taskPending(qkey));
    listener.bind(queueEvents.taskRunning(qkey));
    listener.bind(queueEvents.artifactCreated(qkey));
    listener.bind(queueEvents.taskCompleted(qkey));
    listener.bind(queueEvents.taskFailed(qkey));
    listener.bind(queueEvents.taskException(qkey));

    listener.on('message', (message) => {        
      onMessageAction(message);
    });

    listener.on('error', (err = new Error("Unknown error")) => {
      console.error('Error within the Listener: ', err);
      listener.close();
      onMessageAction(err);
    });

    listener.resume();
  },

  // Stop listening and create a new instance for the next listener
  stopListening() {
    listener.close();
    listener = new taskcluster.WebListener();
  }  
};

/**
* Rendering Erorr and Success messages
*/
export const rendering = {
  renderError: (err) => {
    // Find some sort of summary or error code
    const code = !err.code && err.statusCode ?
      `HTTP ${err.statusCode}` :
      `${err.code} Error`;

    // Find some sort of message
    const message = err.message || '```\n' + err.stack + '\n```';
    const title = <bs.Button bsStyle="link">Additional details...</bs.Button>;
    
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
    );
  }
};

/**
* beautified functions
*/
export const beautified = {
  labelClassName: (state) => {
    return `status-label label-${state}`;  
  }
};

/**
* Push notifications
*/
export const notifications = {
  notifyUser: (message) => {
    let e = new Notification(message, {
      icon: '/lib/assets/taskcluster-36.png'
    });
  },
  requestPermission: () => {
    Notification.requestPermission();
  }
};
