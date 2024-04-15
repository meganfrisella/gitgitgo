const { PromisePool } = require("@supercharge/promise-pool");
const args = require("yargs").argv;
const { start, promisify } = require("./lib");

const main = (server, interName) => {
  // key="doc1", value=bodyStr
  const map = (key, value, cb) => { 
    const words = value.split(/\s+/);
    const termCount = words.reduce((count, word) => {
        return count + (word === term ? 1 : 0);
    }, 0);
    const tf = termCount / words.length;
    cb([[key, {"docName": docName, "tf": tf}]]);
  };

  // key="word", value=[(doc1, tf), (doc2, tf)...]
  const reduce = (key, values, cb) => {
    cb(values[0]);
  };
  
  promisify(distribution.main.store.get)({
    key: null,
    col: interName,
  })
    .then((v) =>
      promisify(distribution.main.mr.exec)({
        keys: v,
        col: interName,
        map,
        reduce,
        state: {},
      })
    )
    .then((v) => promisify(distribution.main.store.get)(v))
    .then((v) => {
      console.log(v.length);
    })
    .catch((e) => console.error(e))
    .finally(() => server.close());
};

start(args.nodesConfig || "data/nodesConfig.json", main);
