const { promisify } = require("./lib");

const indexTf = (interName, megaCb) => {
  // key="doc1", value={body:"", description:""}
  const map = (key, value, state, cb) => {
    console.log("tfMappppp")
    // process text
    let text = value.body + value.description;
    text = text.toLowerCase().match(/\b\w+\b/g);

    const words = text.split(/\s+/);

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
    console.log(tfScores)
    cb([tfScores]);
  };

  // key="word", value=[(doc1, tf), (doc2, tf)...]
  const reduce = (key, values, state, cb) => {
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
    .then((v) => megaCb(null, v))
    .catch((e) => {
      console.error(e);
      megaCb(e, null);
    })
};

module.exports = {indexTf};
