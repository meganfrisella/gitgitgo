const id = require("../util/id.js");
const crypto = require("crypto");

const defaultCallback = (e, v) => (e ? console.error(e) : console.log(v));

const mr = function (config = { gid: "all" }) {
  const context = {};
  context.gid = config.gid;

  return {
    exec: (mrConfig, cb = defaultCallback) => {
      const mrID = `mr-${crypto.randomUUID()}`;
      const col = mrConfig.col || "default";
      const out = mrConfig.out || `${mrID}-out`;
      mrSvc = {
        state: mrConfig.state || {},
        mapper: mrConfig.map,
        reducer: mrConfig.reduce,

        map: function (keys, gid, col, out, mrID, cb = function () {}) {
          const { PromisePool } = require("@supercharge/promise-pool");
          const { promisify, promisifySingle } = require("../util/util.js");
          let err = [];
          const keysPromise =
            keys === null
              ? promisify(distribution.local.store.get)({
                  key: null,
                  gid,
                  col,
                })
              : Promise.resolve(keys);
          keysPromise
            .then((keys) =>
              PromisePool.for(keys)
                .withConcurrency(10)
                .handleError((e) => err.push(e))
                .process((key) =>
                  promisify(distribution.local.store.get)({
                    key: key,
                    gid,
                    col,
                  })
                    .then((v) =>
                      promisifySingle(this.mapper)(key, v, this.state)
                    )
                    .then((res) => {
                      return PromisePool.for(res)
                        .withConcurrency(2)
                        .handleError((e) => err.push(e))
                        .process((out) => {
                          let [outKey, outVal] = out;
                          return promisify(distribution.local.store.append)(
                            outVal,
                            {
                              key: outKey,
                              gid,
                              col: `${mrID}-map`,
                            }
                          );
                        });
                    })
                )
            )
            .then(() => {
              cb(err, null);
            });
        },

        shuffle: function (gid, col, out, mrID, cb = function () {}) {
          const { PromisePool } = require("@supercharge/promise-pool");
          const { promisify, promisifySingle } = require("../util/util.js");

          let err = [];
          promisify(distribution.local.store.get)({
            key: null,
            gid: gid,
            col: `${mrID}-map`,
          })
            .then((keys) =>
              PromisePool.for(keys)
                .withConcurrency(10)
                .handleError((e) => err.push(e))
                .process((key) => {
                  return promisify(distribution.local.store.get)({
                    key: key,
                    gid: gid,
                    col: `${mrID}-map`,
                  }).then((vals) =>
                    promisify(distribution[gid].store.extend)(vals, {
                      key: key,
                      gid: gid,
                      col: `${mrID}-reduce`,
                    })
                  );
                })
            )
            .then(() => cb(err, null))
            .catch((e) => cb(e, null));
        },

        reduce: function (gid, col, out, mrID, cb = function () {}) {
          const { PromisePool } = require("@supercharge/promise-pool");
          const { promisify, promisifySingle } = require("../util/util.js");
          const nodeDir = require("path").join(
            __dirname,
            "../../store",
            global.moreStatus.sid
          );
          let err = [];
          promisify(distribution.local.store.get)({
            key: null,
            gid: gid,
            col: `${mrID}-reduce`,
          })
            .then((keys) => {
              return PromisePool.for(keys)
                .withConcurrency(10)
                .handleError((e) => err.push(e))
                .process((key) => {
                  promisify(distribution.local.store.get)({
                    key: key,
                    gid: gid,
                    col: `${mrID}-reduce`,
                  })
                    .then((vals) =>
                      promisifySingle(this.reducer)(key, vals, this.state)
                    )
                    .then((res) =>
                      promisify(distribution.local.store.put)(res, {
                        key: key,
                        gid: gid,
                        col: out,
                      })
                    );
                });
            })
            .then(() => {
              require("fs").rmSync(
                require("path").join(nodeDir, gid, `${mrID}-map`),
                { recursive: true, force: true }
              );
              require("fs").rmSync(
                require("path").join(nodeDir, gid, `${mrID}-reduce`),
                { recursive: true, force: true }
              );
            })
            .then(() => cb(err, null))
            .catch((e) => cb(e, null));
        },
      };

      const partitionKeys = function (keys, group) {
        if (keys === null) {
          let out = {};
          Object.keys(group).forEach((nid) => {
            out[nid] = null;
          });
          return out;
        }
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

      distribution[context.gid].routes.put(mrSvc, mrID, (e, v) => {
        distribution.local.groups.get(context.gid, (e, group) => {
          let keyPartition = partitionKeys(mrConfig.keys, group);
          var cnt = 0;
          const numNodes = Object.keys(group).length;
          let mapRem = { service: mrID, method: "map" };

          for (let sid in group) {
            mapRem.node = group[sid];
            distribution.local.comm.send(
              [keyPartition[sid], context.gid, col, out, mrID],
              mapRem,
              (e, v) => {
                if (e && e.length > 0) {
                  console.error(e);
                }
                ++cnt;
                if (cnt == numNodes) {
                  let shufRem = { service: mrID, method: "shuffle" };
                  distribution[context.gid].comm.send(
                    [context.gid, col, out, mrID],
                    shufRem,
                    (e, v) => {
                      if (e && e.length > 0) {
                        console.error(e);
                      }
                      let redRem = { service: mrID, method: "reduce" };
                      distribution[context.gid].comm.send(
                        [context.gid, col, out, mrID],
                        redRem,
                        (e, v) => {
                          distribution[context.gid].routes.del(mrID, (e, v) => {
                            cb(null, {
                              col: out,
                              gid: context.gid,
                              key: null,
                            });
                          });
                        }
                      );
                    }
                  );
                }
              }
            );
          }
        });
      });
    },
  };
};

module.exports = mr;
