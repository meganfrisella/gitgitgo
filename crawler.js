const crawler = (keys, cb) => {
    const map = (key, value) => {
      const http = require('http');
      http.get(value, (res) => {
        let data = [];
        res.on('data', (chunk) => {
          data.push(chunk);
        });
  
        res.on('end', () => {
          distribution['crawler'].store.put(data, `${key}-download`);
        });
      });
  
      const o = {};
      o[key] = `${key}-download`;
      return o;
    };
  
    const reduce = (key, values) => {
      const o = {};
      o[key] = values[0];
      return o;
    };
  
    const config = {
      map,
      reduce,
      keys
    };
  
    distribution['crawler'].mr.exec(config, (e, v) => {
      cb(e, v);
    });
};

module.exports = crawler;
