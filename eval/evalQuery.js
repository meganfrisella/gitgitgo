const { query } = require("./../bin/query");
const { start, promisify } = require("./../bin/lib");
const distribution = require("./../distribution");
const args = require("yargs").argv;

const word = "function";

const evalQuery = () => {
  const t0 = performance.now();
  promisify(query)(word)
    .then((res) => {
      const t1 = performance.now();
      console.log(`query time: ${t1 - t0}`);
      console.log(res);
    })
    .catch(console.error);
};

start(args.nodesConfig || "data/nodesConfig.json", evalQuery);
