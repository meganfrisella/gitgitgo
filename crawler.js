const crawler = (keys, gid, cb) => {
    const cMap = (key, value, gid) => {
      console.log('calling http get');

      global.http.get(value, (res) => {
        let data = [];
        res.on('data', (chunk) => {
          console.log(JSON.parse(chunk))
          data.push(chunk);
        });
  
        res.on('end', () => {
          console.log("data")
          // console.log(Object.keys(data))
          // distribution[gid].store.put(data, {key: `${key}-crawled`});
        });
      });
  
      const o = {};
      o[key] = `${key}-crawled`;
      return o;
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
      console.log("herere")
      cb(e, v);
    });
};

module.exports = crawler;
