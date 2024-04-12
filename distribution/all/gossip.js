const localComm = require('../local/comm');

const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
};

const gossip = (config = {gid: 'all'}) => {
  const context = {};
  context.gid = config.gid || 'all';
  context.subset = config.subset || ((n) => Math.floor(Math.log(n)) + 1);
  return {
    send: function(msg, rem, cb = defaultCallback) {
      let remote = {service: 'gossip', method: 'recv'};
      if (!Object.hasOwn(rem, 'timestamp')) {
        rem.timestamp = Date.now();
      }
      const group = global.nodeState.groupsStore.get(context.gid);
      const sids = Object.keys(group);
      const numNodes = Object.keys(group).length;
      let cnt = 0;
      const nodeToValue = {};
      const nodeToError = {};
      const numToSend = context.subset(numNodes);
      const seenIdxs = new Set();
      while (seenIdxs.size < numToSend) {
        const i = getRandomInt(numNodes);
        if (seenIdxs.has(i)) {
          continue;
        } else {
          let sid = sids[i];
          remote.node = group[sid];
          seenIdxs.add(i);
          localComm.send([msg, rem, config], remote, (e, v) => {
            rem.node = group[sid];
            localComm.send(msg, rem, (e, v) => {
              ++cnt;
              if (v) {
                nodeToValue[sid] = v;
              }
              if (e) {
                nodeToError[sid] = e;
              }
              if (cnt == numToSend) {
                cb(nodeToError, nodeToValue);
              }
            });
          });
        }
      }
    },
    at: (interval, svc, cb = defaultCallback) => {
      cb(null, setInterval(svc, interval));
    },
    del: (id, cb = defaultCallback) => {
      cb(null, clearInterval(id));
    },
  };
};

module.exports = gossip;
