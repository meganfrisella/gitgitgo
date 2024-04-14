const id = require('../util/id');
const localComm = require('../local/comm');

const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);
const isError = (e) => {
  return e instanceof Error || !(e === null ||
      (typeof e === 'object' && Object.keys(e).length === 0));
};

const store = (config = { gid: 'all', hash: id.naiveHash }) => {
  const context = config;
  context.gid = config.gid || 'all';
  context.hash = config.hash;

  return {
    get: function (conf, cb = defaultCallback) {
      let key = conf.key || null;
      const msg = [{
        ...conf,
        gid: context.gid,
      }];
      if (key === null) {
        const distributionWithContext = global.distribution[context.gid];
        const rem = { service: 'store', method: 'get' };
        return distributionWithContext.comm.send(msg, rem, (e, v) => {
          if (isError(e)) {
            return cb(e, undefined);
          }
          const allEntries = Object.values(v).reduce((a, b) => a.concat(b));
          return cb(null, allEntries);
        });
      }

      const kid = id.getID(key);
      const group = global.nodeState.groupsStore.get(context.gid);
      const nid = context.hash(kid, Object.keys(group));
      const rem = { service: 'store', method: 'get', node: group[nid] };
      return localComm.send(msg, rem, (e, v) => {
        cb(e, v);
      });
    },

    put: function (obj, conf, cb = defaultCallback) {
      let key = conf.key || null;
      if (key === null) {
        key = id.getID(obj);
      }
      const kid = id.getID(key);
      const group = global.nodeState.groupsStore.get(context.gid);
      const nid = context.hash(kid, Object.keys(group));
      const rem = { service: 'store', method: 'put', node: group[nid] };
      const msg = [obj, {
        ...conf,
        gid: context.gid,
      }];
      localComm.send(msg, rem, cb);
    },

    append: function (obj, conf, cb = defaultCallback) {
      let key = conf.key;
      const kid = id.getID(key);
      const group = global.nodeState.groupsStore.get(context.gid);
      const nid = context.hash(kid, Object.keys(group));
      const rem = { service: 'store', method: 'append', node: group[nid] };
      const msg = [obj, {
        ...conf,
        gid: context.gid,
      }];
      localComm.send(msg, rem, cb);
    },

    extend: function (objs, conf, cb = defaultCallback) {
      let key = conf.key;
      const kid = id.getID(key);
      const group = global.nodeState.groupsStore.get(context.gid);
      const nid = context.hash(kid, Object.keys(group));
      const rem = { service: 'store', method: 'extend', node: group[nid] };
      const msg = [objs, {
        ...conf,
        gid: context.gid,
      }];
      localComm.send(msg, rem, cb);
    },

    del: function (conf, cb = defaultCallback) {
      let key = conf.key;
      const kid = id.getID(key);
      const group = global.nodeState.groupsStore.get(context.gid);
      const nid = context.hash(kid, Object.keys(group));
      const rem = { service: 'store', method: 'del', node: group[nid] };
      const msg = [{ ...conf, gid: context.gid }];
      localComm.send(msg, rem, cb);
    },

    reconf: (groupCopy, col='default', cb = defaultCallback) => {
      const distributionWithContext = global.distribution[context.gid];
      const newGroup = global.nodeState.groupsStore.get(context.gid);
      return distributionWithContext.store.get({
        key: null,
        col: col,
      }, (e, v) => {
        if (isError(e)) {
          return cb(e);
        }
        let nKeys = v.length;
        let count = 0;
        const errors = {};
        const createAggregateMessage = (key) => {
          return (e, v) => {
            if (isError(e)) {
              errors[key] = e;
            }
            count += 1;
            if (count < nKeys) {
              return;
            }
            return cb(errors, null);
          };
        };

        for (const key of v) {
          const kid = id.getID(key);
          const oldNID = context.hash(kid, Object.keys(groupCopy));
          const newNID = context.hash(kid, Object.keys(newGroup));
          if (newNID === oldNID) {
            count += 1;
            continue;
          }
          const fromNode = groupCopy[oldNID];
          const toNode = newGroup[newNID];
          const aggregateMessage = createAggregateMessage(key, fromNode, toNode);
          localComm.send([{ key: key, gid: context.gid }], {
            service: 'store',
            method: 'get',
            node: fromNode,
          }, (e, obj) => {
            if (isError(e)) {
              return aggregateMessage(e, null);
            }
            localComm.send([obj, { key: key, gid: context.gid }], {
              service: 'store',
              method: 'put',
              node: toNode,
            }, aggregateMessage);
          });
        }
      });
    },
  };
};

module.exports = store;
