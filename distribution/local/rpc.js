const {toLocal} = require('../util/wire');

const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);

const rpc = {};

rpc.call = function(remotePointer, args, cb = defaultCallback) {
  toLocal.get(remotePointer)(...args, cb);
};

module.exports = rpc;
