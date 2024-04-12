/*

Service  Description                                Methods
status   Status and control of the current node     get, spawn, stop
comm     A message communication interface          send
groups   A mapping from group names to nodes        get, put, add, rem, del
gossip   The receiver part of the gossip protocol   recv
routes   A mapping from names to functions          get, put

*/

/* Status Service */

const status = require('./status');

/* Groups Service */

const groups = require('./groups');

/* Routes Service */

const routes = require('./routes');

/* Comm Service */

const comm = require('./comm');

/* RPC Service */

const rpc = require('./rpc');

/* Gossip Service */

const gossip = require('./gossip');

/* Mem Service */

const mem = require('./mem');

/* Store Service */

const store = require('./store');

global.nodeState.routesStore.set('status', status);
global.nodeState.routesStore.set('groups', groups);
global.nodeState.routesStore.set('routes', routes);
global.nodeState.routesStore.set('comm', comm);
global.nodeState.routesStore.set('rpc', rpc);
global.nodeState.routesStore.set('gossip', gossip);
global.nodeState.routesStore.set('mem', mem);
global.nodeState.routesStore.set('store', store);

module.exports = {
  status: status,
  routes: routes,
  comm: comm,
  groups: groups,
  gossip: gossip,
  mem: mem,
  store: store,
};
