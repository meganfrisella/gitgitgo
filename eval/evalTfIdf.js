const { indexIdf } = require("./../bin/idxIdf");
const { indexTf } = require("./../bin/idxTf");
const { start, promisify } = require("./../bin/lib");
const distribution = require("./../distribution");
const args = require("yargs").argv;

const evalTfIdf = (server) => {
  const t0 = performance.now();
  promisify(indexTf)()
  .then((res) =>
    promisify(distribution.main.store.get)({
      key: null,
      col: "docs",
    })
  )
  .then((res) => promisify(indexIdf)(res.length))
  .then((res) => {
    const t1 = performance.now();
    console.log(`item processed: ${Object.keys(res).length}`);
    console.log(`execution time: ${t1 - t0}`);
  })
  .catch(console.error)
  .finally(() => server.close());
};

start(args.nodesConfig || "data/nodesConfig.json", evalTfIdf);
