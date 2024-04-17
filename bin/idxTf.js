const { promisify } = require("./lib");

const indexTf = (cb) => {
  const map = (docid, content, state, cb) => {
    // content = content[0]; // this is because I messed up the crawl a little
    // process text
    let text = content.body;
    if (content.description) {
      text = `${text} ${content.description}`;
    }
    const words = text.toLowerCase().match(/\b\w+\b/g);

    // get each word frequency
    const wordFrequency = new Map();
    words.forEach((word) => {
      wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
    });

    // push TF score for each word
    const totalWords = words.length;
    const tfScores = [];
    wordFrequency.forEach((count, word) => {
      const tf = count / totalWords;
      tfScores.push([word, { docid: docid, tf: tf }]);
    });

    cb(tfScores);
  };

  // key="word", value=[(doc1, tf), (doc2, tf)...]
  const reduce = (key, values, state, cb) => {
    const seenDocIds = {};
    const out = [];
    values.forEach((value) => {
      const docid = value.docid;
      if (!(docid in seenDocIds)) {
        out.push(value);
        seenDocIds[docid] = true;
      }
    });

    cb(out);
  };
  const inputCol = "docs";
  const outCol = "tf";
  promisify(distribution.main.store.get)({
    key: null,
    col: inputCol,
  })
    .then((v) =>
      promisify(distribution.main.mr.exec)({
        keys: v,
        col: inputCol,
        out: outCol,
        map,
        reduce,
        state: {},
      })
    )
    .then((v) => cb(null, v))
    .catch((e) => {
      console.error(e);
      cb(e, null);
    });
};

module.exports = { indexTf };
