const { promisify } = require("./lib");

const indexIdf = (interName, megaCb) => {
  // key="word", value=[(doc1, tf), (doc2, tf)...]

  const map = (key, value, state, cb) => {
    const totalDocs = parseInt(fs.readFileSync("./numDocs.json", "utf8"));
    const docsWithTerm = value.length;
    const idf = Math.log((totalDocs + 1) / (docsWithTerm + 1));

    const ret = [];
    for (let i = 0; i < value.length; i++) {
      const entry = value[i];
      ret.push([key, {"docName": entry.docid, "tfidf": entry.tf * idf}]);
      if (i == value.length - 1) {
        cb(ret);
      }
    }
  };

  // key="word", value=[(doc1, tfidf), (doc2, tfidf)...]
  const reduce = (key, values, state, cb) => {
    cb(values.sort((a, b) => b.tfidf - a.tfidf));
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
        state: {
          getLimiter: () => {
            if (!this.limiter)
              this.limiter = new Bottleneck({ maxConcurrent: 10 });
          },
        },
      })
    )
    .then((v) => megaCb(null, v))
    .catch((e) => {
      console.error(e);
      megaCb(e, null);
    })
};

module.exports = {indexIdf};
