const { PromisePool } = require("@supercharge/promise-pool");
const args = require("yargs").argv;
const { start, promisify } = require("./lib");

const indexTf = (interName) => {
  // key="doc1", value={body:"", description:""}
  const map = (key, value, cb) => {
    // process text
    const text = value.body + value.description;
    text.toLowerCase().match(/\b\w+\b/g);

    // get each word frequency
    const wordFrequency = {};
    words.forEach(word => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });

    // push TF score for each word
    const totalWords = words.length;
    const tfScores = [];
    Object.keys(wordFrequency).forEach(word => {
        const tf = wordFrequency[word] / totalWords;
        tfScores.push({"docName": key, "tf": tf})
    });
    cb([tfScores]);
  };

  // key="word", value=[(doc1, tf), (doc2, tf)...]
  const reduce = (key, values, cb) => {
    cb(values[0]);
  };
  
  promisify(distribution.main.store.get)({
    key: null,
    col: interName,
  })
    .then((v) =>
      promisify(distribution.main.mr.exec)({
        keys: v,
        col: interName,
        map,
        reduce,
        state: {},
      })
    )
    .then((v) => promisify(distribution.main.store.get)(v))
    .then((v) => {
      console.log(v.length);
    })
    .catch((e) => console.error(e))
    // .finally(() => server.close());
};

module.exports = {indexTf};
