const { promisify, start } = require("./lib");
const args = require("yargs").argv;
const natural = require("natural");

const query = (q, k, cb) => {
  const words = q
    .toLowerCase()
    .match(/\b\w+\b/g)
    .map(natural.PorterStemmer.stem);

  Promise.all(
    words.map((word) =>
      promisify(distribution.main.store.get)({
        key: word,
        col: "tfidf",
        k: k,
      }).catch((err) => [])
    )
  )
    .then((hitsPerWord) => {
      const hits = new Map();
      hitsPerWord.forEach((wordHits) => {
        wordHits.forEach((hit) => {
          const doc = hit.docName;
          const tfidf = hit.tfidf;
          if (!hits.has(doc)) {
            hits.set(doc, 0);
          }
          hits.set(doc, hits.get(doc) + tfidf);
        });
      });
      return [...hits.entries()].sort((a, b) => b[1] - a[1]).slice(0, k);
    })
    .then((res) => cb(null, res))
    .catch((e) => cb(e));
  // key="word", value=[(doc1, tfidf), (doc2, tfidf)...]
};

module.exports = { query };

const main = () => {
  const t0 = performance.now();
  promisify(query)(args._[0], 10)
    .then((hits) => {
      const t1 = performance.now();
      console.log(`Top ${hits.length} hits for query: ${args._[0]}`);
      console.log(`Retrieved in: ${t1 - t0}ms`);
      hits.forEach(([doc, score], i) => {
        console.log(`${doc}: https://www.github.com/${doc}`);
      });
    })
    .catch(console.error);
};

if (require.main === module) {
  start(args.nodesConfig || "data/nodesConfig.json", main, true);
}
