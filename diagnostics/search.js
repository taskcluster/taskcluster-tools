import $ from 'jquery';
import _ from 'lodash';
import assume from 'assume';
import { Parser } from 'xml2js';
import qs from 'querystring';

const BASE_URL = 'http://taskcluster-diagnostic-logs.s3.amazonaws.com';

/* Utils */
const get = url => {
  return new Promise((resolve, reject) => {
    return $.ajax({
      url,
      dataType: "text",
      type: "GET",
      success: resolve,
      error: reject
  });
}

const parse = xml => {
  let parser = Parser();
  return new Promise((resolve, reject) => {
    return parser.parseString(xml, (err,res) => {
      if (err) {
        return reject(err);
      }
      resolve(res);
    });
  });
}
/*
 * Key structure:
 * <env>/<JSON|RAW>/<99999999 - unix timestamp>/< JSON Date >/<testId>.<json|log>
 */
const searchById = (contents, id) => {  
  return _.find(contents, c =>{
    return c['Key'].indexOf(id) != -1;
  });
}

const searchByDate = (contents, date) => {
  assume(date instanceof Date).equals(true);
  let f = ['getDay','getMonth','getYear'];

  return _.find(contents, c => {
    let k = c['Key'];
    let logDate = new Date(k.split('/')[3]);
    let match = true;
    f.forEach(f => {
      match = match && (date[f]() == logDate[f]());
    });
    return match;
  });
}

const getContents = async (env , type) => {
  
  assume(env).is.either(['production', 'development']);
  assume(type).is.either(['JSON', 'RAW']);  

  url = [BASE_URL, qs.stringify({
    prefix:[env, type].join('/')
  })].join('?');

  try{
    let rawXml = await get(url);
    let json = await parse(rawXml);
    return json['ListBucketResult']['Contents'];
  }catch(err){
    throw err;
  }
}

/*
 * TODO:
 * Replace retrieve.js with search.js
 * Clean up app.jsx
 * Add search functionality
 */
