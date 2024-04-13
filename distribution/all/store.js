const id = require('../util/id');
const localComm = require('../local/comm');

const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);

const store = (config = { gid: 'all', hash: id.naiveHash }) => {
  const context = config;
  const allKeys = [];
  context.gid = config.gid || 'all';
  context.hash = config.hash;

  return {
    get: function (conf, cb = defaultCallback) {
      let key = conf.key || null;
      let col = conf.col || null;
      if (!key) {
        cb({}, allKeys);
      } else {
        const kid = id.getID(key);
        const group = global.nodeState.groupsStore.get(context.gid);
        const nid = context.hash(kid, Object.keys(group));
        const rem = { service: 'store', method: 'get', node: group[nid] };
        const msg = [{ key: key, gid: context.gid, conf: col }];
        localComm.send(msg, rem, (e, v) => {
          cb(e, v);
        });
      }
    },

    put: function (obj, conf, cb = defaultCallback) {
      let key = conf.key || null;
      let col = conf.col || null;
      if (!key) {
        key = id.getID(obj);
      }
      allKeys.push(key);
      const kid = id.getID(key);
      const group = global.nodeState.groupsStore.get(context.gid);
      const nid = context.hash(kid, Object.keys(group));
      const rem = { service: 'store', method: 'put', node: group[nid] };
      const msg = [obj, { key: key, gid: context.gid, col: col }];
      localComm.send(msg, rem, (e, v) => {
        cb(e, v);
      });
    },

    del: function (conf, cb = defaultCallback) {
      let key = conf.key || null;
      let col = conf.col || null;

      const kid = id.getID(key);
      const group = global.nodeState.groupsStore.get(context.gid);
      const nid = context.hash(kid, Object.keys(group));
      const rem = { service: 'store', method: 'del', node: group[nid] };
      const msg = [{ key: key, gid: context.gid, col: col }];
      localComm.send(msg, rem, (e, v) => {
        cb(e, v);
      });
    },

    reconf: (groupCopy, cb = defaultCallback) => {
      const getRem = { service: 'store', method: 'get' };
      const delRem = { service: 'store', method: 'del' };
      const putRem = { service: 'store', method: 'put' };
      const newGroup = global.nodeState.groupsStore.get(context.gid);
      allKeys.forEach((key) => {
        const kid = id.getID(key);
        const oldNID = context.hash(kid, Object.keys(groupCopy));
        const newNID = context.hash(kid, Object.keys(newGroup));
        let msg = [{ key: key, gid: context.gid }];
        if (oldNID != newNID) {
          getRem.node = groupCopy[oldNID];
          localComm.send(msg, getRem, (e, obj) => {
            if (e) {
              cb(e, null);
            } else {
              delRem.node = groupCopy[oldNID];
              localComm.send(msg, delRem, (e, v) => {
                if (e) {
                  cb(e, null);
                } else {
                  putRem.node = newGroup[newNID];
                  msg = [obj, { key: key, gid: context.gid }];
                  localComm.send(msg, putRem, (e, v) => {
                    cb(e, v);
                  });
                }
              });
            }
          });
        }
      });
      cb(null, null);
    },
  };
};

module.exports = store;
