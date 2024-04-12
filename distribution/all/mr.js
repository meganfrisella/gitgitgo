const id = require('../util/id.js');

const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);

const mr = function (config = { gid: 'all' }) {
  const context = {};
  context.gid = config.gid;

  return {
    exec: (mrConfig, cb = defaultCallback) => {
      const mrID = id.getSID(mrConfig);

      mrSvc = {
        mapper: mrConfig.map,
        reducer: mrConfig.reduce,

        map: function (keys, gid, mrID, cb = function () { }) {
          if (keys.length == 0) {
            cb(null, {});
          } else {
            let out = [];
            let cnt = 0;
            keys.forEach((key) => {
              distribution[gid].store.get(key, (e, val) => {
                cnt++;
                out.push(this.mapper(key, val));
                if (cnt == keys.length) {
                  distribution.local.store.put(out, `${mrID}_map`, (e, v) => {
                    cb(e, out);
                  });
                }
              });
            });
          }
        },

        shuffle: function (gid, mrID, cb = function () { }) {
          const group = function (mapped) {
            let grouped = {};
            for (const res of mapped) {
              if (!Array.isArray(res)) {
                for (const [key, val] of Object.entries(res)) {
                  if (Object.hasOwn(grouped, key)) {
                    grouped[key].push(val);
                  } else {
                    grouped[key] = [val];
                  }
                }
              } else {
                for (const entry of res) {
                  for (const [key, val] of Object.entries(entry)) {
                    if (Object.hasOwn(grouped, key)) {
                      grouped[key].push(val);
                    } else {
                      grouped[key] = [val];
                    }
                  }
                }
              }
            }
            return grouped;
          };

          distribution.local.store.get(`${mrID}_map`, (e, mapped) => {
            if (!e) {
              let grouped = group(mapped);
              let rem = { service: 'mem', method: 'putMR' };
              cnt = 0;
              Object.keys(grouped)
                .forEach((key) => {
                  distribution[gid].comm
                    .send([grouped[key], key], rem, (e, v) => {
                      cnt++;
                      if (cnt == Object.keys(grouped).length) {
                        cb(null, {});
                      }
                    });
                });
            } else {
              cb(e, {});
            }
          });
        },

        reduce: function (gid, mrID, cb = function () { }) {
          distribution.local.mem.getMR(null, (e, keys) => {
            let out = [];
            let cnt = 0;
            keys.forEach((key) =>
              distribution.local.mem.getMR(key, (e, vals) => {
                let res = this.reducer(key, vals);
                out = out.concat(res);
                cnt++;
                if (cnt == keys.length) {
                  cb(null, out);
                }
              }));
          });
        },
      };

      const partitionKeys = function (keys, group) {
        let out = {};
        Object.keys(group).forEach((nid) => {
          out[nid] = [];
        });
        keys.forEach((key) => {
          let kid = id.getID(key);
          let nid = id.naiveHash(kid, Object.keys(group));
          out[nid].push(key);
        });
        return out;
      };


      distribution[context.gid].routes.put(mrSvc, `mr-${mrID}`, (e, v) => {
        distribution.local.groups.get(context.gid, (e, group) => {
          let keyPartition = partitionKeys(mrConfig.keys, group);
          var cnt = 0;
          const numNodes = Object.keys(group).length;
          let mapRem = { service: `mr-${mrID}`, method: 'map' };

          for (let sid in group) {
            if (true) {
              mapRem.node = group[sid];
              let msg = [keyPartition[sid], context.gid, mrID];
              distribution.local.comm.send(msg, mapRem, (e, v) => {
                ++cnt;
                if (cnt == numNodes) {
                  let shufRem = { service: `mr-${mrID}`, method: 'shuffle' };
                  distribution[context.gid].comm
                    .send([context.gid, mrID], shufRem, (e, v) => {
                      let redRem = { service: `mr-${mrID}`, method: 'reduce' };
                      distribution[context.gid].comm
                        .send([context.gid, mrID], redRem, (e, out) => {
                          distribution[context.gid].routes
                            .del(`mr-${mrID}`, (e, v) => {
                              let ret = [];
                              for (let val of Object.values(out)) {
                                ret = ret.concat(val);
                              }
                              cb(null, ret);
                            });
                        });
                    });
                }
              });
            }
          }
        });
      });
    },
  };
};

module.exports = mr;
