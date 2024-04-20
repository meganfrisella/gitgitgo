const { promisify } = require("./lib");

const crawler = (cb) => {
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
        cb([[key, { body, description: value.description }]]);
      })
      .catch((e) => {
        console.error(e);
        cb([]);
      });
  };

  const reduce = (key, values, state, cb) => {
    cb(values[0]);
  };

  promisify(distribution.main.mr.exec)({
    keys: null,
    col: "urls",
    out: "docs",
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
    .then((v) => cb(null, v))
    .catch((e) => {
      console.error(e);
      cb(e, null);
    });
};

module.exports = { crawler };
