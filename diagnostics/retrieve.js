let _           = require('lodash');
let Promise     = require('bluebird');
let assert      = require('assert');
let parser      = require('xml2js').Parser();
let querystring = require('querystring');
let $           = require('jquery');
/*
This module retreives the latest JSON and Raw logs from the server
*/

const BUCKET_NAME = 'taskcluster-diagnostic-logs';
const REGION = 'us-west-2';
const BASE_URL = 'https://taskcluster-diagnostic-logs.s3.amazonaws.com';

const parsePromise = xml => {
  return new Promise((resolve, reject) => {
    return parser.parseString(xml,(err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve(res);
    });
  });
}

const requestGet = url => {
  return new Promise((resolve, reject) => {
    return $.ajax({
      url,
      dataType: "text",
      type: "GET",
      success: resolve,
      error: () => { console.log("Error:",url) }
    });
  });
}

const getLatestLog = async (env, logtype) => {
  
  assert(logtype === 'JSON' || logtype === 'RAW', "Logtype should be one of { JSON, RAW }");
  assert(env == 'development' || env == 'production', "env should be one of { production, development }");
  
  let log_url = BASE_URL +'?' + querystring.stringify({
    prefix: [env, logtype].join('/')
  });
  
  try{
    // Get the logs from the s3 bucket
    var xmlres = await requestGet(log_url);
    // Parse XML
    var res = await parsePromise(xmlres);
    // Get key of latest log
    var key = res['ListBucketResult']['Contents'][0]['Key'];
    var testId = _.chain(key).split('/').last().dropRight(5).value();
    var testDate = _.chain(key).split('/').dropRight().last().value();
    var log = await requestGet(BASE_URL +'/'+ key);
    return { testId, testDate, log };

  }catch(err){
    return { err };
  }
}

const parseResult = jsonResult => {

  const component = str => str.split('/')[0];
  const test = str => _.drop(str.split('/'));

  let result = {};

  jsonResult.pass.forEach(res => {
    let _comp = component(res);
    let _test = test(res);

    if(result[_comp] === undefined){
        result[_comp] = {};
        result[_comp].pass = [];
        result[_comp].fail = [];
    }

    result[_comp].pass.push(_test);
  });

  jsonResult.fail.forEach(res => {
    let _comp = component(res);
    let _test = test(res);

    if(result[_comp] === undefined){
        result[_comp].pass = [];
        result[_comp].fail = [];
    }

    result[_comp].fail.push(_test);
  });

  return result;
}

module.exports = { getLatestLog , parseResult };
