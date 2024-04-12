const localComm = require('../local/comm');

const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);

const comm = (config = {gid: 'all'}) => {
  const context = {};
  context.gid = config.gid;
  return {
    send: function(msg, rem, cb = defaultCallback) {
      const group = global.nodeState.groupsStore.get(context.gid);
      const numNodes = Object.keys(group).length;
      var cnt = 0;
      const nodeToValue = {};
      const nodeToError = {};
      for (let sid in group) {
        if (true) {
          rem.node = group[sid];
          localComm.send(msg, rem, (e, v) => {
            ++cnt;
            if (v) {
              nodeToValue[sid] = v;
            }
            if (e) {
              nodeToError[sid] = e;
            }
            if (cnt == numNodes) {
              cb(nodeToError, nodeToValue);
            }
          });
        }
      }
    },
  };
};

module.exports = comm;
