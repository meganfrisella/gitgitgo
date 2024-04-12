
const gossip = {};

const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);

const receivedGossip = new Set();

gossip.recv = function(msg, rem, config, cb = defaultCallback) {
  console.log('node', global.nodeConfig.port, 'recieved gossip');
  const {send} = require('../all/gossip.js')(config);
  if (receivedGossip.has(rem.timestamp)) {
    console.log('node', global.nodeConfig.port, 'gossip already seen');
    cb(null, null);
  } else {
    receivedGossip.add(rem.timestamp);
    send(msg, rem, cb);
  }
};

module.exports = gossip;
