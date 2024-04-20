const { promisify, start } = require("./lib");
const args = require("yargs").argv;
const natural = require("natural");

const query = (word, cb) => {
  // key="word", value=[(doc1, tfidf), (doc2, tfidf)...]
  distribution.main.store.get(
    {
      key: word,
      col: "tfidf",
    },
    cb
  );
};

module.exports = { query };

const main = (server) => {
  const query = args._[0];
  const words = query
    .toLowerCase()
    .match(/\b\w+\b/g)
    .map(natural.PorterStemmer.stem);
  promisify(query)(words[0])
    .then(console.log)
    .catch(console.error)
    .finally(() => server.close());
};

if (require.main === module) {
  start(args.nodesConfig || "data/nodesConfig.json", main);
}
