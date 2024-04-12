const routes = {};

global.nodeState.routesStore = new Map();

const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);

routes.get = function(key, cb = defaultCallback) {
  if (global.nodeState.routesStore.has(key)) {
    cb(null, global.nodeState.routesStore.get(key));
  } else {
    cb(Error('routes.get called on bad key.'), null);
  }
};

routes.put = function(svc, key, cb = defaultCallback) {
  console.log('putting route ', key, ' on node ', global.nodeConfig.port);
  global.nodeState.routesStore.set(key, svc);
  cb(null, svc);
};

routes.del = function(key, cb = defaultCallback) {
  const obj = global.nodeState.routesStore.get(key);
  if (global.nodeState.routesStore.delete(key)) {
    cb(null, obj);
  } else {
    cb(Error('routes.del called on bad key.'), null);
  }
};

module.exports = routes;
