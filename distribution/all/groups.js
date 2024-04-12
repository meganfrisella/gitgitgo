const id = require('../util/id');
const localGroups = require('../local/groups');

const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);

const groups = (config = {gid: 'all'}) => {
  const context = {};
  context.gid = config.gid;
  return {
    get: function(key, cb = defaultCallback) {
      console.log(`getting group ${key} on group ${context.gid}`);
      let remote = {service: 'groups', method: 'get'};
      distribution[context.gid].comm.send([key], remote, cb);
    },
    put: function(config, group, cb = defaultCallback) {
      var key;
      if (Object.hasOwn(config, 'gid')) {
        key = config.gid;
      } else {
        key = config;
      }
      console.log(`putting group ${key} on group ${context.gid}`);
      localGroups.put(key, group, (e, v) => {
        let remote = {service: 'groups', method: 'put'};
        distribution[context.gid].comm.send([key, group], remote, cb);
      });
    },
    add: function(groupKey, node, cb = defaultCallback) {
      console.log(`adding node ${JSON.stringify(node)} to group 
        ${groupKey} on group ${context.gid}`);
      let remote = {service: 'groups', method: 'add'};
      distribution[context.gid].comm.send([groupKey, node], remote, cb);
      global.nodeState.groupsStore.get(groupKey)[id.getSID(node)] = node;
      global.nodeState.groupsStore.get('all')[id.getSID(node)] = node;
    },
    rem: function(groupKey, nodeKey, cb = defaultCallback) {
      console.log(`removing node ${nodeKey} from group 
        ${groupKey} on group ${context.gid}`);
      let remote = {service: 'groups', method: 'rem'};
      distribution[context.gid].comm.send([groupKey, nodeKey], remote, cb);
      delete global.nodeState.groupsStore.get(context.gid)[nodeKey];
    },
    del: function(groupKey, cb = defaultCallback) {
      console.log(`deleting group ${groupKey} from group ${context.gid}`);
      let remote = {service: 'groups', method: 'del'};
      distribution[context.gid].comm.send([groupKey], remote, cb);
      delete distribution[groupKey];
    },
  };
};

module.exports = groups;
