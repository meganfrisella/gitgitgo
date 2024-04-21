const { indexIdf } = require("./bin/idxIdf");
const { indexTf } = require("./bin/idxTf");
const { crawler } = require("./bin/crawl");
const { start, promisify } = require("./bin/lib");
const distribution = require("./distribution");
const args = require("yargs").argv;

const main = () => {
  let beforeCrawl = Date.now();
  let beforeIndex = Date.now();
  console.log("Crawling...");
  console.log(beforeCrawl);
  promisify(crawler)()
    .then((res) => {
      console.log("Computing index tf...");
      beforeIndex = Date.now();
      console.log(beforeIndex);
      return promisify(indexTf)();
    })
    .then((res) =>
      promisify(distribution.main.store.get)({
        key: null,
        col: "docs",
      })
    )
    .then((res) => {
      console.log("Computing index idf...");
      console.log(Date.now());
      return promisify(indexIdf)(res.length);
    })
    .then((res) => {
      const afterIndex = Date.now();
      console.log(afterIndex);
      console.log("Crawl time:", beforeIndex - beforeCrawl);
      console.log("Index time:", afterIndex - beforeIndex);
      console.log("Total time:", afterIndex - beforeCrawl);
      console.log(res);
    })
    .catch(console.error);
};

start(args.nodesConfig || "data/nodesConfig.json", main);
