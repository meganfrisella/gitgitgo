const { promisify } = require("./lib");

const indexTf = (interName, megaCb) => {
  const map = (docid, content, state, cb) => {
    // process text
    let text = content.body + content.description;
    const words = text.toLowerCase().match(/\b\w+\b/g);

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
        tfScores.push([word, {"docid": docid, "tf": tf}]);
    });

    cb(tfScores);
  };

  // key="word", value=[(doc1, tf), (doc2, tf)...]
  const reduce = (key, values, state, cb) => {
    const seenDocIds = {};
    const out = [];
    values.forEach(value => {
      const docid = value.docid;
      if (!(docid in seenDocIds)) {
        out.push(value);
        seenDocIds[docid] = true;
      }
    });

    cb(out);
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
    .then((v) => megaCb(null, v))
    .catch((e) => {
      console.error(e);
      megaCb(e, null);
    });
};

module.exports = {indexTf};
