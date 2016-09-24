import $ from 'jquery';
import _ from 'lodash';
import assume from 'assume';
import { Parser } from 'xml2js';
import qs from 'querystring';

const BASE_URL = 'http://taskcluster-diagnostic-logs.s3.amazonaws.com';

/* Utils */
const get = url => new Promise((resolve, reject) => $.ajax({
  url,
  dataType: 'text',
  type: 'GET',
  success: resolve,
  error: reject
}));

const parse = xml => {
  const parser = Parser(); // eslint-disable-line babel/new-cap

  return new Promise((resolve, reject) => parser
    .parseString(xml, (err, res) => err ?
      reject(err) :
      resolve(res)));
};

/*
 * Key structure:
 * <env>/<JSON|RAW>/<99999999 - unix timestamp>/< JSON Date >/<testId>.<json|log>
 */
const searchById = (contents, id) => _.find(contents, c => c.Key.includes(id));

const searchByDate = (contents, date) => {
  assume(date instanceof Date).equals(true);

  const methods = ['getDay', 'getMonth', 'getYear'];

  return _.find(contents, c => {
    const k = c.Key;
    const logDate = new Date(k.split('/')[3]);
    let match = true;

    methods.forEach(f => {
      match = match && (date[f]() === logDate[f]());
    });

    return match;
  });
};

const getContents = async (env, type) => {
  assume(env).is.either(['production', 'development']);
  assume(type).is.either(['JSON', 'RAW']);

  const url = `${BASE_URL}?${qs.stringify({ prefix: `${env}/${type}` })}`;
  const rawXml = await get(url);
  const json = await parse(rawXml);

  return json.ListBucketResult.Contents;
};

/*
 * TODO:
 * Replace retrieve.js with search.js
 * Clean up app.jsx
 * Add search functionality
 */
