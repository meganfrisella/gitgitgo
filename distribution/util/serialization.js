const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');
const path = require('path');
const os = require('os');
const events = require('events');
const stream = require('stream');
const util = require('util');
const querystring = require('querystring');
const zlib = require('zlib');
const buffer = require('buffer');
const childProcess = require('child_process');
const cluster = require('cluster');
const dgram = require('dgram');
const dns = require('dns');
const http2 = require('http2');
const v8 = require('v8');

// ----------------------------------- //
//       PASS: Native Functions        //
// ----------------------------------- //

const stringToNative = new Map();
const nativeToString = new Map();
stringToNative.set('global', global);
nativeToString.set(global, 'global');
scan(global, 'global', stringToNative, nativeToString);
scan(fs, 'fs', stringToNative, nativeToString);
scan(http, 'http', stringToNative, nativeToString);
scan(https, 'https', stringToNative, nativeToString);
scan(url, 'url', stringToNative, nativeToString);
scan(path, 'path', stringToNative, nativeToString);
scan(os, 'os', stringToNative, nativeToString);
scan(events, 'events', stringToNative, nativeToString);
scan(stream, 'stream', stringToNative, nativeToString);
scan(util, 'util', stringToNative, nativeToString);
scan(querystring, 'querystring', stringToNative, nativeToString);
scan(zlib, 'zlib', stringToNative, nativeToString);
scan(buffer, 'buffer', stringToNative, nativeToString);
scan(childProcess, 'childProcess', stringToNative, nativeToString);
scan(cluster, 'cluster', stringToNative, nativeToString);
scan(dgram, 'dgram', stringToNative, nativeToString);
scan(dns, 'dns', stringToNative, nativeToString);
scan(http2, 'http2', stringToNative, nativeToString);
scan(v8, 'v8', stringToNative, nativeToString);

function scan(obj, key, stringToNative, nativeToString) {
  var newKey = '';
  var newObj = {};
  Object.entries(Object.getOwnPropertyDescriptors(obj)).forEach((item) => {
    newKey = key + '.' + item[0];
    newObj = item[1].value;
    if (nativeToString.has(newObj)) {
      return;
    }
    stringToNative.set(newKey, newObj);
    nativeToString.set(newObj, newKey);
    if (newObj != null &&
            (typeof newObj == 'function' || typeof newObj == 'object')) {
      scan(newObj, newKey, stringToNative, nativeToString);
    }
  });
}

// ----------------------------------- //
//           PASS: Serialize           //
// ----------------------------------- //

function serialize(object) {
  const out = serializeInner(object, new Map(), 0);
  return JSON.stringify(out[0]);
}

function serializeInner(object, seen, id) {
  var obj = {};
  if (seen.has(object)) {
    obj = {type: 'ref', value: seen.get(object)};
  } else {
    var obj = {};
    switch (typeof object) {
      case 'number':
        obj = {type: 'number', value: object.toString()};
        break;
      case 'string':
        obj = {type: 'string', value: object};
        break;
      case 'boolean':
        obj = {type: 'boolean', value: object.toString()};
        break;
      case 'undefined':
        obj = {type: 'undefined', value: ''};
        break;
      case 'function':
        if (nativeToString.has(object)) {
          obj = {type: 'function', value: nativeToString.get(object)};
        } else {
          obj = {type: 'function', value: '(' + object.toString() + ')'};
        }
        break;
      case 'object':
        if (object == null) {
          obj = {type: 'null', value: ''};
        } else if (nativeToString.has(object)) {
          obj = {type: 'object', value: nativeToString.get(object)};
        } else if (object instanceof Array) {
          [obj, id] = serializeArray(object, seen, id);
        } else {
          [obj, id] = serializeObject(object, seen, id);
        }
        break;
    }
  }
  return [obj, id];
}

function serializeArray(object, seen, id) {
  const out = [];
  var res = {};

  const outerId = id;
  id = id + 1;

  seen.set(object, outerId);

  object.forEach((val) => {
    [res, id] = serializeInner(val, seen, id);
    out.push(res);
  });

  return [{type: 'array', id: outerId, value: out}, id];
}

function serializeObject(object, seen, id) {
  var obj = {};

  if (object instanceof Date) {
    obj = {type: 'date', value: object};
  } else if (object instanceof Error) {
    obj = {type: 'error', value: object.message};
  } else {
    const out = {};
    var res = {};
    const outerId = id;
    id = id + 1;
    seen.set(object, outerId);
    for (const [key, val] of Object.entries(object)) {
      [res, id] = serializeInner(val, seen, id);
      out[key] = res;
    }
    obj = {type: 'object', id: outerId, value: out};
  }
  return [obj, id];
}


// ----------------------------------- //
//          PASS: Deserialize          //
// ----------------------------------- //

function deserialize(string) {
  const refs = new Map();
  const out = deserializeInner(JSON.parse(string), refs);
  setRefs(out, refs);
  return out;
}

function deserializeInner(object, refs) {
  var res = {};
  switch (object.type) {
    case 'number':
      res = Number(object.value);
      break;
    case 'string':
      res = String(object.value);
      break;
    case 'boolean':
      if (object.value == 'true') {
        res = true;
      } else {
        res = false;
      }
      break;
    case 'array':
      res = deserializeArray(object.value, refs);
      break;
    case 'object':
      if (stringToNative.has(object.value)) {
        res = eval(stringToNative.get(object.value));
      } else {
        res = deserializeObject(object.value, refs);
      }
      break;
    case 'function':
      if (stringToNative.has(object.value)) {
        res = eval(stringToNative.get(object.value));
      } else {
        res = eval(object.value);
      }
      break;
    case 'date':
      res = new Date(object.value);
      break;
    case 'error':
      res = new Error(object.value);
      break;
    case 'null':
      res = null;
      break;
    case 'undefined':
      res = undefined;
      break;
    case 'ref':
      res = new Ref(object.value);
      break;
    default:
      res = {};
  }
  if (Object.hasOwn(object, 'id')) {
    refs.set(object.id, res);
  }
  return res;
}

function deserializeArray(object, refs) {
  const out = [];
  var res = {};
  object.forEach((val) => {
    res = deserializeInner(val, refs);
    out.push(res);
  });
  return out;
}

function deserializeObject(object, refs) {
  const out = {};
  var res = {};
  for (const [key, val] of Object.entries(object)) {
    res = deserializeInner(val, refs);
    out[key] = res;
  }
  return out;
}


// ----------------------------------- //
//         PASS: Detect Cycles         //
// ----------------------------------- //

function Ref(value) {
  this.value = value;
}

function setRefs(object, refs) {
  if (object == null) {
    return;
  }
  switch (typeof object) {
    case 'object':
      Object.getOwnPropertyNames(object).forEach((val, idx, array) => {
        const obj = object[val];
        if (obj instanceof Ref) {
          object[val] = refs.get(obj.value);
        } else {
          setRefs(obj, refs);
        }
      });
    default:
      return;
  }
}


module.exports = {
  serialize: serialize,
  deserialize: deserialize,
};

