const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);

const routes = (config = {gid: 'all'}) => {
  const context = {};
  context.gid = config.gid;
  return {
    get: function(key, cb = defaultCallback) {
      console.log(`getting route ${key} on group ${context.gid}`);
      let remote = {service: 'routes', method: 'get'};
      distribution[context.gid].comm.send([key], remote, cb);
    },
    put: function(svc, key, cb = defaultCallback) {
      console.log(`putting route ${key} on group ${context.gid}`);
      let remote = {service: 'routes', method: 'put'};
      distribution[context.gid].comm.send([svc, key], remote, cb);
    },
    del: function(key, cb = defaultCallback) {
      console.log(`deleting route ${key} from group ${context.gid}`);
      let remote = {service: 'routes', method: 'del'};
      distribution[context.gid].comm.send([key], remote, cb);
    },
  };
};

module.exports = routes;
