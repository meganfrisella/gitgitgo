const id = require('../util/id');
const localComm = require('../local/comm');

const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);

const store = (config = {gid: 'all', hash: id.naiveHash}) => {
  const context = config;
  const allKeys = [];
  context.gid = config.gid || 'all';
  context.hash = config.hash;
  return {
    get: function(key, cb = defaultCallback) {
      if (!key) {
        cb({}, allKeys);
      } else {
        let origKey; let gidKey;
        if (key.includes(context.gid)) {
          origKey = key.substring(context.gid.length, key.length);
          gidKey = key;
        } else {
          origKey = key;
          gidKey = context.gid + key;
        }
        const kid = id.getID(origKey);
        const group = global.nodeState.groupsStore.get(context.gid);
        const nid = context.hash(kid, Object.keys(group));
        const rem = {service: 'store', method: 'get'};
        const msg = [gidKey];
        rem.node = group[nid];
        localComm.send(msg, rem, (e, v) => {
          cb(e, v);
        });
      }
    },
    put: function(obj, key, cb = defaultCallback) {
      if (!key) {
        key = id.getID(obj);
      }
      let origKey; let gidKey;
      if (key.includes(context.gid)) {
        origKey = key.substring(context.gid.length, key.length);
        gidKey = key;
      } else {
        origKey = key;
        gidKey = context.gid + key;
      }
      allKeys.push(origKey);
      const kid = id.getID(origKey);
      const group = global.nodeState.groupsStore.get(context.gid);
      const nid = context.hash(kid, Object.keys(group));
      const rem = {service: 'store', method: 'put'};
      const msg = [obj, gidKey];
      rem.node = group[nid];
      localComm.send(msg, rem, (e, v) => {
        cb(e, v);
      });
    },
    del: function(key, cb = defaultCallback) {
      let origKey; let gidKey;
      if (key.includes(context.gid)) {
        origKey = key.substring(context.gid.length, key.length);
        gidKey = key;
      } else {
        origKey = key;
        gidKey = context.gid + key;
      }
      const kid = id.getID(origKey);
      const group = global.nodeState.groupsStore.get(context.gid);
      const nid = context.hash(kid, Object.keys(group));
      const rem = {service: 'store', method: 'del'};
      const msg = [gidKey];
      rem.node = group[nid];
      localComm.send(msg, rem, (e, v) => {
        cb(e, v);
      });
    },
    reconf: (groupCopy, cb = defaultCallback) => {
      const getRem = {service: 'store', method: 'get'};
      const delRem = {service: 'store', method: 'del'};
      const putRem = {service: 'store', method: 'put'};
      const newGroup = global.nodeState.groupsStore.get(context.gid);
      allKeys.forEach((key) => {
        let origKey; let gidKey;
        if (key.includes(context.gid)) {
          origKey = key.substring(context.gid.length, key.length);
          gidKey = key;
        } else {
          origKey = key;
          gidKey = context.gid + key;
        }
        const kid = id.getID(origKey);
        const oldNID = context.hash(kid, Object.keys(groupCopy));
        const newNID = context.hash(kid, Object.keys(newGroup));
        let msg = [gidKey];
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
                  msg = [obj, gidKey];
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
