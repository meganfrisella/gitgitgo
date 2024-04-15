const { PromisePool } = require("@supercharge/promise-pool");
const args = require("yargs").argv;
const { start, promisify } = require("./lib");

const main = (server) => {
  // key="word", value=[(doc1, tf), (doc2, tf)...]
  const map = (key, value, cb) => { 
    const totalDocs = 0; // TODO: total doc num? 
    const docsWithTerm = value.length;
    const idf = Math.log((totalDocs + 1) / (docsWithTerm + 1));
    const docName = value[0];
    const tf = value[1];
    const tfidf = tf * idf;
    cb([[key, {"docName": docName, "tfidf": tfidf}]]);
  };

  // key="word", value=[(doc1, tfidf), (doc2, tfidf)...]
  const reduce = (key, values, cb) => {
    cb(values.sort((a, b) => b.tfidf - a.tfidf));
  };
  
  promisify(distribution.main.store.get)({
    key: null,
    col: "todo",
  })
    .then((v) =>
      promisify(distribution.main.mr.exec)({
        keys: v,
        col: "todo",
        map,
        reduce,
        state: {
          getLimiter: () => {
            if (!this.limiter)
              this.limiter = new Bottleneck({ maxConcurrent: 10 });
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
