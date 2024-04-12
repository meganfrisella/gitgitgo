const localStatus = require('../local/status');
const localGroups = require('../local/groups');

const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);

const status = (config = {gid: 'all'}) => {
  const context = {};
  context.gid = config.gid;
  return {
    get: function(key, cb = defaultCallback) {
      console.log(`getting status ${key} on group ${context.gid}`);
      let remote = {service: 'status', method: 'get'};
      distribution[context.gid].comm.send([key], remote, (e, v) => {
        if (key == 'counts' || key == 'heapTotal' || key == 'heapUsed') {
          var tot = 0;
          for (let sid in v) {
            if (true) {
              tot = tot + v[sid];
            }
          }
          cb(e, tot);
        } else {
          cb(e, v);
        }
      });
    },
    stop: function(cb = defaultCallback) {
      console.log(`stopping group ${context.gid}`);
      let remote = {service: 'status', method: 'stop'};
      distribution[context.gid].comm.send([], remote, (e, v) => {
        localStatus.stop(cb);
      });
    },
    spawn: function(node, cb = defaultCallback) {
      localStatus.spawn(node, (e, v) => {
        distribution[context.gid].groups.add(config.gid, node, (e, v) => {
          localGroups.add(config.gid, node, (e, v) => {
            cb(e, node);
          });
        });
      });
    },
  };
};

module.exports = status;
