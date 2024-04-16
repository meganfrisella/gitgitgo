const { PromisePool } = require("@supercharge/promise-pool");
const args = require("yargs").argv;
const { start, promisify } = require("./lib");

const main = (server) => {
  promisify(distribution.main.store.get)({
    key: null,
    col: "mr-46ce2075-6507-43a5-b07a-5573e680a7a7-map",
  })
    .then((v) => {
      console.log(v.length);
    })
    .catch((e) => console.error(e))
    .finally(() => server.close());
};

start(args.nodesConfig || "data/nodesConfig.json", main);
