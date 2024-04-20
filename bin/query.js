const { promisify } = require("./lib");

const query = (res, word, cb) => {
  // key="word", value=[(doc1, tfidf), (doc2, tfidf)...]
  promisify(distribution.main.store.get)({
    key: word,
    col: res,
  })
    .then((value) => {
        let ret = '';
        for (let i = 0; i < value.length; i++) {
          const entry = value[i];
          ret += `${entry.docid} | ${entry.tfidf}\n`
          if (i == value.length - 1) {
            cb(null, ret);
          }
        }
    })
    .catch((e) => {
      console.error(e);
      cb(null);
    })
};

module.exports = {query};