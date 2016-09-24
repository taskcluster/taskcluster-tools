import ansiRegex from 'ansi-regex';

const dataOffset = 0;
let request;

const divide = data => {
  const tester = ansiRegex();
  const matcher = /.{1,139}/g;

  return data
    .split(/\n|\[K|\[[0-9]B|\[[1-9][0-9]B/)
    .reduce((arr, line) => {
      if (line.length < 140 || line.match(tester)) {
        arr.push(line);
      } else {
        arr.push(...line.match(matcher));
      }

      return arr;
    }, []);
};

const onData = e => {
  const resp = {};

  if (request.responseText != null) {
    // Check if we have new data
    const length = request.responseText.length;

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
      resp.data = ['\r\n[task-inspector] Failed to fetch log!\r\n'];
    } else {
      resp.data = divide(request.responseText);
    }
  }

  postMessage(resp);

  if (resp.done) {
    close();
  }
};

const abort = () => {
  request.removeEventListener('progress', onData);
  request.removeEventListener('load', onData);
  request.abort();
  close();
};

self.addEventListener('message', e => {
  if (e.data.url) {
    request = new XMLHttpRequest();
    request.open('get', e.data.url, true);
    request.addEventListener('loadstart', onData);
    request.addEventListener('progress', onData);
    request.addEventListener('load', onData);
    request.send();
  }

  if (e.data.abort) {
    abort();
  }
});
