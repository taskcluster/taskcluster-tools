import assert from 'assert';
import { Parser } from 'xml2js';
import querystring from 'querystring';
import $ from 'jquery';

/*
 This module retrieves the latest JSON and Raw logs from the server
 */

const parser = new Parser();
const BASE_URL = 'https://taskcluster-diagnostic-logs.s3.amazonaws.com';
const parsePromise = xml =>
  new Promise((resolve, reject) =>
    parser.parseString(xml, (err, res) => (err ? reject(err) : resolve(res)))
  );
const requestGet = url =>
  new Promise(resolve =>
    $.ajax({
      url,
      dataType: 'text',
      type: 'GET',
      success: resolve
    })
  );
const getLatestLog = async (env, logType) => {
  assert(
    logType === 'JSON' || logType === 'RAW',
    'Logtype should be one of { JSON, RAW }'
  );
  assert(
    env === 'development' || env === 'production',
    'env should be one of { production, development }'
  );

  const logUrl = `${BASE_URL}?${querystring.stringify({
    prefix: `${env}/${logType}`
  })}`;

  try {
    // Get the logs from the s3 bucket
    const xmlResponse = await requestGet(logUrl);
    // Parse XML
    const res = await parsePromise(xmlResponse);
    // Get key of latest log
    const key = res.ListBucketResult.Contents[0].Key;
    const segment = key.reduce(
      (reduction, item) => [...reduction, ...item.split('/')],
      []
    );
    const testId = segment[segment.length - 1].slice(0, -5);
    const right = segment.slice(0, -1);
    const testDate = right[right.length - 1];
    const log = await requestGet(`${BASE_URL}/${key}`);

    return { testId, testDate, log };
  } catch (err) {
    return { err };
  }
};

const parseResult = jsonResult => {
  const component = str => str.split('/')[0];
  const test = str => str.split('/').slice(1);
  const result = {};

  jsonResult.pass.forEach(res => {
    const comp = component(res);
    const testResult = test(res);

    if (result[comp] == null) {
      result[comp] = {};
      result[comp].pass = [];
      result[comp].fail = [];
    }

    result[comp].pass.push(testResult);
  });

  jsonResult.fail.forEach(res => {
    const comp = component(res);
    const testResult = test(res);

    if (result[comp] == null) {
      result[comp].pass = [];
      result[comp].fail = [];
    }

    result[comp].fail.push(testResult);
  });

  return result;
};

export default { getLatestLog, parseResult };
