const { query } = require("./../bin/query");
const { start, promisify } = require("./../bin/lib");
const fs = require("fs");
const distribution = require("./../distribution");
const args = require("yargs").argv;

const evalQuery = () => {
  const words = fs
    .readFileSync("data/5000-more-common.txt", "utf-8")
    .split("\n");
  const allStart = performance.now();
  Promise.all(
    words.map((word) => {
      const start = performance.now();
      return promisify(query)(word, 5)
        .then((res) => {
          const end = performance.now();
          const time = end - start;
          // console.log(time);
          return time;
        })
        .catch(console.error);
    })
  ).then((times) => {
    const allEnd = performance.now();
    console.log("Total time:", allEnd - allStart);
    console.log("Throughput:", words.length / ((allEnd - allStart) / 1000));
    // console.log(times.reduce((a, b) => a + b) / times.length);
  });
};

start(args.nodesConfig || "data/nodesConfig.json", evalQuery);
