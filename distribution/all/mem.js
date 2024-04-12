const id = require('../util/id');
const localComm = require('../local/comm');

const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);

const mem = (config = {gid: 'all', hash: id.naiveHash}) => {
  const context = config;
  const allKeys = [];
  context.gid = config.gid || 'all';
  context.hash = config.hash || id.naiveHash;
  return {
    get: function(key, cb = defaultCallback) {
      if (!key) {
        cb({}, allKeys);
      } else {
        const kid = id.getID(key);
        const group = global.nodeState.groupsStore.get(context.gid);
        const nid = context.hash(kid, Object.keys(group));
        const rem = {service: 'mem', method: 'get'};
        const msg = [{key: key, gid: context.gid}];
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
      allKeys.push(key);
      const kid = id.getID(key);
      const group = global.nodeState.groupsStore.get(context.gid);
      const nid = context.hash(kid, Object.keys(group));
      const rem = {service: 'mem', method: 'put'};
      const msg = [obj, {key: key, gid: context.gid}];
      rem.node = group[nid];
      localComm.send(msg, rem, (e, v) => {
        cb(e, v);
      });
    },
    del: function(key, cb = defaultCallback) {
      const kid = id.getID(key);
      const group = global.nodeState.groupsStore.get(context.gid);
      const nid = context.hash(kid, Object.keys(group));
      const rem = {service: 'mem', method: 'del'};
      const msg = [{key: key, gid: context.gid}];
      rem.node = group[nid];
      localComm.send(msg, rem, (e, v) => {
        cb(e, v);
      });
    },
    putMR: function(obj, key, cb = defaultCallback) {
      const kid = id.getID(key);
      const group = global.nodeState.groupsStore.get(context.gid);
      const nid = context.hash(kid, Object.keys(group));
      const rem = {service: 'mem', method: 'putMR'};
      const msg = [obj, key];
      rem.node = group[nid];
      localComm.send(msg, rem, (e, v) => {
        cb(e, v);
      });
    },
    getMR: function(obj, key, cb = defaultCallback) {
      const kid = id.getID(key);
      const group = global.nodeState.groupsStore.get(context.gid);
      const nid = context.hash(kid, Object.keys(group));
      const rem = {service: 'mem', method: 'getMR'};
      const msg = [key];
      rem.node = group[nid];
      localComm.send(msg, rem, (e, v) => {
        cb(e, v);
      });
    },
    reconf: (groupCopy, cb = defaultCallback) => {
      const getRem = {service: 'mem', method: 'get'};
      const delRem = {service: 'mem', method: 'del'};
      const putRem = {service: 'mem', method: 'put'};
      const newGroup = global.nodeState.groupsStore.get(context.gid);
      allKeys.forEach((key) => {
        const kid = id.getID(key);
        const oldNID = context.hash(kid, Object.keys(groupCopy));
        const newNID = context.hash(kid, Object.keys(newGroup));
        let msg = [{key: key, gid: context.gid}];
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
                  msg = [obj, {key: key, gid: context.gid}];
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

module.exports = mem;
