const id = require('../util/id');
const fs = require('fs');
const path = require('path');

const groups = {};

const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);

global.nodeState.groupsStore = new Map();

const localGroup = {};
localGroup[global.moreStatus.sid] = global.nodeConfig;

global.nodeState.groupsStore.set('local', localGroup);
global.nodeState.groupsStore.set('all', localGroup);

const nodeDir = path.join(__dirname, '../../store', global.moreStatus.sid);

groups.get = function (key, cb = defaultCallback) {
  if (global.nodeState.groupsStore.has(key)) {
    cb(null, global.nodeState.groupsStore.get(key));
  } else {
    cb(Error('groups.get called on bad key.'), null);
  }
};

groups.put = function (key, group, cb = defaultCallback) {
  global.nodeState.groupsStore.set(key, group);
  distribution[key] = {};

  const allGroup = global.nodeState.groupsStore.get('all');
  for (const sid in group) {
    if (true) {
      allGroup[sid] = group[sid];
    }
  }

  const config = { gid: key };
  distribution[key].comm = require('../all/comm.js')(config);
  distribution[key].gossip = require('../all/gossip.js')(config);
  distribution[key].groups = require('../all/groups.js')(config);
  distribution[key].routes = require('../all/routes.js')(config);
  distribution[key].status = require('../all/status.js')(config);
  distribution[key].mem = require('../all/mem.js')(config);
  distribution[key].store = require('../all/store.js')(config);
  distribution[key].mr = require('../all/mr.js')(config);

  fs.mkdirSync(path.join(nodeDir, key), { recursive: true });
  cb(null, group);
};

groups.add = function (groupKey, node, cb = defaultCallback) {
  if (global.nodeState.groupsStore.has(groupKey)) {
    global.nodeState.groupsStore.get(groupKey)[id.getSID(node)] = node;
    global.nodeState.groupsStore.get('all')[id.getSID(node)] = node;
    cb(null, node);
  } else {
    cb(Error('groups.add called on bad group key.'), null);
  }
};

groups.rem = function (groupKey, nodeKey, cb = defaultCallback) {
  console.log(`removing node ${nodeKey} from node 
    ${JSON.stringify(global.nodeConfig)}`);
  if (global.nodeState.groupsStore.has(groupKey)) {
    const node = global.nodeState.groupsStore.get(groupKey)[nodeKey];
    delete global.nodeState.groupsStore.get(groupKey)[nodeKey];
    cb(null, node);
  } else {
    cb(Error('groups.rem called on bad group key.'), null);
  }
};

groups.del = function (groupKey, cb = defaultCallback) {
  const group = global.nodeState.groupsStore.get(groupKey);
  if (global.nodeState.groupsStore.delete(groupKey)) {
    delete distribution[groupKey];
    fs.rmSync(path.join(nodeDir, groupKey), { recursive: true, force: true });
    cb(null, group);
  } else {
    cb(Error('groups.del called on bad key.'), null);
  }
};

module.exports = groups;
