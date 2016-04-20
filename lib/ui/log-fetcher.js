var source = function(){
var request;
var dataOffset = 0;
var cols;

function onData(e){
    var resp = {};
    if (request.responseText !== null ||
        request.responseText !== undefined) {
      // Check if we have new data
      var length = request.responseText.length;
      if (length > dataOffset) {
        var data = "Loading log: " + e.loaded + ' / ' + e.total;
        resp.data = [data];
        resp.done = false;
      }
    }
    // When request is done
    if (request.readyState === request.DONE) {
      resp.done = true;
      // Write an error, if request failed
      if (request.status !== 200){
        resp.data = ["\r\n[task-inspector] Failed to fetch log!\r\n"];
      } else {
        var temp = request.responseText.split('\n');
        var lines = [];
        temp.forEach(function(line){
            for(var i = 0; i < line.length; i += cols)
                lines.push(line.substr(i, cols));
        });
        resp.data = lines;
      }
    }
  postMessage(resp);
  if(resp.done) close();
}

function abort(){
    request.removeEventListener('progress', onData);
    request.removeEventListener('load', onData);
    request.abort();
    close();
}

self.addEventListener('message', function(e){
    if(e.data.url){
        cols = e.data.cols;
        request = new XMLHttpRequest();
        request.open('get', e.data.url, true);
        request.addEventListener('progress', onData);
        request.addEventListener('load', onData);
        request.send();
    };
    if(e.data.abort) abort();
});
}.toString().split('\n').slice(1,-1).join('\n');
module.exports = window.URL.createObjectURL(new Blob([source]));
