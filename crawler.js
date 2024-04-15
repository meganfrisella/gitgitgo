const crawler = (keys, gid, cb) => {
    const cMap = (key, value, cb) => {
      const https = require('https');
      
      global.http.get(value, (res) => {
        let data = [];
        res.on('data', (chunk) => {
          data += chunk;
        });
  
        res.on('end', () => {
          distribution.local.store.put(data, {key: `${key}-crawled`}, (e, v) => {
            return true;
          });
        });
      });
    };
  
    const cReduce = (key, values) => {
      const o = {};
      o[key] = values[0];
      return o;
    };
  
    const config = {
      map: cMap,
      reduce: cReduce,
      keys: keys,
    };
  
    distribution[gid].mr.exec(config, (e, v) => {
      cb(e, v);
    });
};

module.exports = crawler;
