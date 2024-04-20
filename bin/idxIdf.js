const { promisify } = require("./lib");

const indexIdf = (nDocs, cb) => {
  // key="word", value=[(doc1, tf), (doc2, tf)...]

  const map = (key, value, state, cb) => {
    const nDocs = state.nDocs;
    const docsWithTerm = value.length;
    const idf = Math.log((nDocs + 1) / (docsWithTerm + 1));

    const ret = [];
    for (let i = 0; i < value.length; i++) {
      const entry = value[i];
      ret.push([key, { docName: entry.docid, tfidf: entry.tf * idf }]);
    }
    cb(ret);
  };

  // key="word", value=[(doc1, tfidf), (doc2, tfidf)...]
  const reduce = (key, values, state, cb) => {
    cb(values.sort((a, b) => b.tfidf - a.tfidf));
  };
  const inputCol = "tf";
  const outputCol = "tfidf";
  promisify(distribution.main.mr.exec)({
    keys: null,
    col: inputCol,
    out: outputCol,
    map,
    reduce,
    state: {
      nDocs,
    },
  })
    .then((v) => cb(null, v))
    .catch((e) => {
      console.error(e);
      cb(e, null);
    });
};

module.exports = { indexIdf };
