let _ = require('lodash');
let Promise = require('bluebird');
let AWS = require('aws-sdk');
let assert = require('assert');
/*
This module retreives the latest JSON and Raw logs from the server
*/

const BUCKET_NAME = 'taskcluster-diagnostic-logs';
const REGION = 'us-west-2';

const getLatestLog = (logtype) => {

    assert(logtype === 'JSON' || logtype === 'RAW', "Logtype should be one of { JSON, RAW }");
    
    let Bucket = BUCKET_NAME;
    let region = REGION;
    let env = 'development';
    let s3 = new AWS.S3({ params: { Bucket, region } });
    
    listPromise = s3.listObjectsV2({
	Bucket,
	Prefix: [env, logtype ].join('/') + '/'
    }).promise();

    let testId;
    let exp = (logtype === 'JSON')? /(\w+).json$/ : /(\w+).log$/;

    return new Promise((resolve, reject) => {
	return listPromise.then(data => {
	    let Key = data.contents[0].Key;
	    temp = _.chain(Key).split('/').last().value();
	    testId = temp.match(exp)[0];
	    return s3.getObject({ Bucket, Key }).promise();
	}).then(data => {

	    let result = { testId }
	    if(logtype === 'JSON'){
		result.log = parseResult(JSON.parse(data.Body));
	    }else{
		result.log = data.Body;
	    }
	    
	    return resolve(result);
	    
	}).catch(err => {
	    return reject(err);
	});	
    });
}

const parseResult = jsonResult => {

    const component = str => str.split('/')[0];
    const test = str => _.drop(str.split('/'));

    result = {};

    jsonResult.pass.forEach(res => {
	let _comp = component(res);
	let _test = test(res);

	if(result[_comp] === undefined){
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

module.exports = parseResult;
