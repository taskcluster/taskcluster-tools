/**
* This file is copy pasted from task group inspector project
*/
module.exports = function (self) {
  var request;
  var dataOffset = 0;

  function divide(data) {
    return data.split('\n');
  }

  function onData(e) {
    var resp = {};
    if (request.responseText != null) {
      // Check if we have new data
      var length = request.responseText.length;
      if (length > dataOffset) {
        resp.data = divide(request.responseText);
        resp.done = false;
      }
    }
    // When request is done
    if (request.readyState === request.DONE) {
      resp.done = true;
      // Write an error, if request failed
      if (request.status !== 200) {
        resp.data = ["\r\n[task-inspector] Failed to fetch log!\r\n"];
      } else {
        resp.data = divide(request.responseText);
      }
    }
    postMessage(resp);
    if (resp.done) {
      close();
    } 
  }

  function abort() {
    request.removeEventListener('progress', onData);
    request.removeEventListener('load', onData);
    request.abort();
    close();
  }

  self.addEventListener('message', function(e) {
    if (e.data.url) {
      request = new XMLHttpRequest();
      request.open('get', e.data.url, true);
      request.addEventListener('loadstart', onData);
      request.addEventListener('progress', onData);
      request.addEventListener('load', onData);
      request.send();
    };
    if (e.data.abort) {
      abort();
    } 
  });
 };
