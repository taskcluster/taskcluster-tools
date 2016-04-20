var source = function(){
var request;
var dataOffset = 0;
var cols;

function divide(data){
    var lines = [];
    data.split('\n').forEach(function(line){
        for(var i = 0; i < line.length; i += cols)
            lines.push(line.substr(i, cols));
    });
    return lines;
}

function onData(e){
    var resp = {};
    if (request.responseText !== null ||
        request.responseText !== undefined){
        // Check if we have new data
        var length = request.responseText.length;
        if (length > dataOffset){
            resp.data = divide(request.responseText);
            resp.done = false;
        }
    }
    // When request is done
    if (request.readyState === request.DONE){
        resp.done = true;
        // Write an error, if request failed
        if (request.status !== 200){
            resp.data = ["\r\n[task-inspector] Failed to fetch log!\r\n"];
        } else {
            resp.data = divide(request.responseText);
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
