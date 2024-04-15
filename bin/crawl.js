const { PromisePool } = require("@supercharge/promise-pool");
const args = require("yargs").argv;
const { start, promisify } = require("./lib");

const main = (server) => {
  const map = (key, value, state, cb) => {
    const limiter = state.getLimiter();
    const promiseRetry = require("promise-retry");
    promiseRetry(
      {
        retries: 3,
        factor: 4,
      },
      (retry) => {
        return limiter
          .schedule(() => fetch(value.url))
          .then((res) => {
            if (!res.ok) {
              if (res.status === 404) {
                throw new Error(`Failed to fetch ${value.url}: 404 Not Found`);
              } else {
                return retry(
                  new Error(`Failed to fetch ${value.url}: ${res.statusText}`)
                );
              }
            }
            return res.text();
          });
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
        state: {
          getLimiter: () => {
            const Bottleneck = require("bottleneck/es5");
            if (!this.limiter) {
              const nRequestsPerHour = 4000;
              const minTime = 1000 / (nRequestsPerHour / 60 / 60);
              this.limiter = new Bottleneck({ minTime });
            }

            return this.limiter;
          },
        },
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
