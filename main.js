const { indexIdf } = require("./bin/idxIdf");
const { indexTf } = require("./bin/idxTf");
const { crawler } = require("./bin/crawl");
const { start, promisify } = require("./bin/lib");
const distribution = require("./distribution");
const args = require("yargs").argv;

const main = (server) => {
  promisify(crawler)()
    .then((res) => promisify(indexTf)())
    .then((res) =>
      promisify(distribution.main.store.get)({
        key: null,
        col: "docs",
      })
    )
    .then((res) => {
      promisify(indexIdf)(res.length);
    })
    .then((res) => {
      console.log("res: ", res);
    })
    .catch(console.error)
    .finally(() => server.close());
};

start(args.nodesConfig || "data/nodesConfig.json", main);
