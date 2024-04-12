const {spawn} = require('node:child_process');
const id = require('../util/id');
const wire = require('../util/wire');
const serialization = require('../util/serialization');
const path = require('path');

const status = {};

global.moreStatus = {
  sid: id.getSID(global.nodeConfig),
  nid: id.getNID(global.nodeConfig),
  counts: 0,
};

const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);

status.get = function(key, cb = defaultCallback) {
  if (key in global.nodeConfig) {
    cb(null, global.nodeConfig[key]);
  } else if (key in moreStatus) {
    cb(null, moreStatus[key]);
  } else if (key === 'heapTotal') {
    cb(null, process.memoryUsage().heapTotal);
  } else if (key === 'heapUsed') {
    cb(null, process.memoryUsage().heapUsed);
  } else {
    cb(new Error('Status key not found'), null);
  }
};

status.stop = function(cb = defaultCallback) {
  console.log('Stopping node', global.nodeConfig);
  const server = global.nodeState.server;
  if (!server) {
    cb(new Error('Node already stopped.'), null);
  } else {
    global.nodeState.server = undefined;
    server.close();
    setTimeout(() => {
      server.closeAllConnections();
      process.exit();
    }, 1000);
    cb(null, global.nodeConfig);
  }
};

status.spawn = function(config, cb = defaultCallback) {
  const stub = wire.createRPC(cb);
  if (config.onStart) {
    funcStr = `let onStart = ${config.onStart.toString()};
               let callbackRPC = ${stub.toString()};
               onStart(args);
               callbackRPC(args);`;
    config.onStart = new Function('args', funcStr);
  } else {
    config.onStart = stub;
  }
  global.nodeState.groupsStore.get('all')[id.getSID(config)] = config;
  const child = spawn('node', [path.join(__dirname, '../../distribution.js'),
    '--config', serialization.serialize(config)]);
  child.stdout.on('data', (data) => {
    console.log('[CLIENT] child stdout:', data.toString());
  });
  child.stderr.on('data', (data) => {
    console.log('[CLIENT] child got error:', data.toString());
    cb(data.toString(), null);
  });
  child.on('error', (err) => {
    console.log('[CLIENT] erorr spawning child');
    cb(err, null);
  });
};

module.exports = status;
