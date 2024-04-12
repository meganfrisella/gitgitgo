const id = require('./id');
const distribution = require('../../distribution'); ;
const {serialize, deserialize} = require('./serialization');

const toLocal = new Map();


function createRPC(func) {
  const hash = id.getID(func);
  toLocal.set(hash, func);
  const stub = function(...args) {
    const callback = args.pop() || function(e, v) {
            e ? console.error(e) : console.log(v);
    };
    let remote = {node: '__NODE_INFO__', service: 'rpc', method: 'call'};
    let hashStr = '__HASH_INFO__';
    distribution.local.comm.send([hashStr, args], remote, callback);
  };
  let nodeStr = JSON.stringify(global.nodeConfig).replaceAll('\"', '\'');
  return deserialize(serialize(stub)
      .replace('\'__NODE_INFO__\'', nodeStr)
      .replace('__HASH_INFO__', hash));
}

/*
    The toAsync function converts a synchronous function that returns a value
    to one that takes a callback as its last argument and returns the value
    to the callback.
*/
function toAsync(func) {
  return function(...args) {
    const callback = args.pop() || function(e, v) {
            e ? console.error(e) : console.log(v);
    };
    try {
      const result = func(...args);
      callback(null, result);
    } catch (error) {
      callback(error);
    }
  };
}

module.exports = {
  createRPC: createRPC,
  toAsync: toAsync,
  toLocal: toLocal,
};
