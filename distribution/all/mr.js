const id = require('../util/id.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto')

const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);
const nodeDir = path.join(__dirname, '../../store', global.moreStatus.sid);

const mr = function (config = { gid: 'all' }) {
  const context = {};
  context.gid = config.gid;

  return {
    exec: (mrConfig, cb = defaultCallback) => {
      const mrID = `mr-${crypto.randomUUID()}`;

      mrSvc = {
        mapper: mrConfig.map,
        reducer: mrConfig.reduce,

        map: function (keys, gid, mrID, cb = function () { }) {
          if (keys.length > 0) {
            let err = [];
            let cnt = 0;
            keys.forEach((key) => {
              distribution[gid].store.get({ key: key }, (e, val) => {
                err.push(e);
                this.mapper(key, val, (res) => {
                  let innerCnt = 0;
                  res.forEach(out => {
                    let [outKey, outVal] = out;
                    distribution.local.store.append(outVal, { key: outKey, gid: gid, col: `${mrID}-map` }, (e, v) => {
                      err.push(e);
                      innerCnt++;
                      if (innerCnt == res.length) {
                        cnt++;
                      }
                      if (cnt == keys.length) {
                        cb(err, null);
                      }
                    });
                  });
                });
              });
            });
          } else {
            cb(null, null);
          }
        },

        shuffle: function (gid, mrID, cb = function () { }) {
          distribution.local.store.get({ key: null, gid: gid, col: `${mrID}-map` }, (e, keys) => {
            if (keys.length > 0) {
              let err = [];
              let cnt = 0;
              keys.forEach(key => {
                distribution.local.store.get({ key: key, gid: gid, col: `${mrID}-map` }, (e, vals) => {
                  err.push(e);
                  distribution[gid].store.extend(vals, { key: key, gid: gid, col: `${mrID}-reduce` }, (e, v) => {
                    err.push(e);
                    cnt++;
                    if (cnt == keys.length) {
                      cb(err, null);
                    }
                  });
                });
              });
            } else {
              cb(null, null);
            }
          });
        },

        reduce: function (gid, mrID, cb = function () { }) {
          const nodeDir = require('path').join(__dirname, '../../store', global.moreStatus.sid);
          distribution.local.store.get({ key: null, gid: gid, col: `${mrID}-reduce` }, (e, keys) => {
            if (keys.length > 0) {
              let err = [];
              let cnt = 0;
              keys.forEach((key) =>
                distribution.local.store.get({ key: key, gid: gid, col: `${mrID}-reduce` }, (e, vals) => {
                  err.push(e);
                  this.reducer(key, vals, (res) => {
                    distribution.local.store.put(res, { key: key, gid: gid, col: `${mrID}-out` }, (e, v) => {
                      err.push(e);
                      cnt++;
                      if (cnt == keys.length) {
                        require('fs').rmSync(require('path').join(nodeDir, gid, `${mrID}-map`), { recursive: true, force: true });
                        require('fs').rmSync(require('path').join(nodeDir, gid, `${mrID}-reduce`), { recursive: true, force: true });
                        cb(err, null);
                      }
                    });
                  });
                }));
            } else {
              require('fs').rmSync(require('path').join(nodeDir, gid, `${mrID}-map`), { recursive: true, force: true });
              require('fs').rmSync(require('path').join(nodeDir, gid, `${mrID}-reduce`), { recursive: true, force: true });
              cb(null, null);
            }
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
              distribution.local.comm.send([keyPartition[sid], context.gid, mrID], mapRem, (e, v) => {
                ++cnt;
                if (cnt == numNodes) {

                  let shufRem = { service: `mr-${mrID}`, method: 'shuffle' };
                  distribution[context.gid].comm.send([context.gid, mrID], shufRem, (e, v) => {

                    let redRem = { service: `mr-${mrID}`, method: 'reduce' };
                    distribution[context.gid].comm.send([context.gid, mrID], redRem, (e, v) => {

                      distribution[context.gid].routes
                        .del(`mr-${mrID}`, (e, v) => {
                          cb(null, { col: `${mrID}-out`, gid: context.gid, key: null });
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
