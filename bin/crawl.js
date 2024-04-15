const { PromisePool } = require("@supercharge/promise-pool");
const args = require("yargs").argv;
const { start, promisify } = require("./lib");

const main = (server) => {
  const map = (key, value, cb) => {
    const promiseRetry = require("promise-retry");
    promiseRetry(
      {
        retries: 3,
      },
      (retry) => {
        fetch(value.url)
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Failed to fetch ${value.url}`);
            }
            return res.text();
          })
          .catch(retry);
      }
    )
      .then((body) => {
        cb([
          [
            key,
            {
              body,
              description: value.description,
            },
          ],
        ]);
      })
      .catch((e) => {
        console.error(e);
        cb([]);
      });
  };
  const reduce = (key, values, cb) => {
    cb(values[0]);
  };
  promisify(distribution.main.store.get)({
    key: null,
    col: "urls",
  })
    .then((v) =>
      promisify(distribution.main.mr.exec)({
        keys: v,
        col: "urls",
        map,
        reduce,
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
