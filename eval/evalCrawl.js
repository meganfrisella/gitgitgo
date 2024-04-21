const { crawler } = require("./../bin/crawl");
const { start, promisify } = require("./../bin/lib");
const distribution = require("./../distribution");
const args = require("yargs").argv;

const evalCrawl = () => {
  const t0 = performance.now();
  promisify(crawler)()
    .then((res) =>
      promisify(distribution.main.store.get)({
        key: null,
        col: "docs",
      })
    )
    .then((res) => {
      const t1 = performance.now();
      console.log(`item processed: ${res.length}`);
      console.log(`execution time: ${t1 - t0}`);
    })
    .catch(console.error);
};

start(args.nodesConfig || "data/nodesConfig.json", evalCrawl);
