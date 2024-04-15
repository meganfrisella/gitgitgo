const { promisify } = require("./lib");

const indexIdf = (interName, megaCb) => {
  // key="word", value=[(doc1, tf), (doc2, tf)...]
  const map = (key, value, state, cb) => { 
    const totalDocs = 10; // TODO: total doc num? 
    const docsWithTerm = value.length;
    const idf = Math.log((totalDocs + 1) / (docsWithTerm + 1));
    const docName = value[0];
    const tf = value[1];
    const tfidf = tf * idf;
    cb([[key, {"docName": docName, "tfidf": tfidf}]]);
  };

  // key="word", value=[(doc1, tfidf), (doc2, tfidf)...]
  const reduce = (key, values, state, cb) => {
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
    .then((v) => megaCb(null, v))
    .catch((e) => {
      console.error(e);
      megaCb(e, null);
    })
};

module.exports = {indexIdf};
