const { PromisePool } = require("@supercharge/promise-pool");
const promiseRetry = require("promise-retry");
const fs = require("fs");
const { start, promisify } = require("./lib");
const args = require("yargs").argv;

const filename = args._[0];
const repositories = JSON.parse(fs.readFileSync(filename, "utf8"));
console.log(`Loaded ${repositories.length} URLs from file`);

const main = (server) => {
  PromisePool.for(repositories)
    .withConcurrency(100)
    .handleError(console.error)
    .process((repo) => {
      const name = repo.name;
      const branch = repo["default_branch"];
      const url = `https://raw.githubusercontent.com/${name}/${branch}/README.md`;
      return promiseRetry((retry) =>
        promisify(distribution.main.store.put)(
          {
            url,
            description: repo.description,
          },
          {
            col: "urls",
            key: name,
          }
        ).catch((e) => {
          console.log(e);
          retry(e);
        })
      );
    })
    .then(() => {
      console.log("All done!");
      return promisify(distribution.main.store.get)({
        key: null,
        col: "urls",
      });
    })
    .then((v) => {
      console.log(`Put ${v.length} URLs in distributed store`);
      console.log(v.slice(0, 10));
    })
    .finally(() => server.close());
};

start(args.nodesConfig || "data/nodesConfig.json", main);
