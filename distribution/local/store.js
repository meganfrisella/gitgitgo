//  ________________________________________
// / hooooooonk honk                        \
// |                                        |
// |                                        |
// \                                        /
//  ----------------------------------------
//         \   ^__^
//          \  (oo)\_______
//             (__)\       )\/\
//                 ||----w |
//                 ||     ||

const fs = require('fs');
const path = require('path');
const id = require('../util/id');
const serialization = require('../util/serialization');

const store = {};

const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);

const nodeDir = path.join(__dirname, '../../store', global.moreStatus.sid);

fs.mkdir(nodeDir,
    {recursive: true}, (err) => {
      if (err) throw err;
    });

store.get = function(key, cb = defaultCallback) {
  if (!key) {
    try {
      let files = fs.readdirSync(nodeDir);
      cb(null, files);
    } catch (err) {
      cb(new Error('store.get ' + err.toString()), null);
    }
  } else {
    try {
      let data = fs.readFileSync(path.join(nodeDir, key));
      cb(null, serialization.deserialize(data));
    } catch (err) {
      cb(new Error('store.get ' + err.toString()), null);
    }
  }
};

store.put = function(obj, key, cb = defaultCallback) {
  if (!key) {
    key = id.getID(obj);
  }
  try {
    fs.writeFileSync(path.join(nodeDir, key), serialization.serialize(obj));
    cb(null, obj);
  } catch (err) {
    cb(new Error('store.put ' + err.toString()), null);
  }
};

store.del = function(key, cb = defaultCallback) {
  try {
    let data = fs.readFileSync(path.join(nodeDir, key));
    try {
      fs.rm(path.join(nodeDir, key));
      cb(null, serialization.deserialize(data));
    } catch (err) {
      cb(new Error('store.del ' + err.toString()), null);
    }
  } catch (err) {
    cb(new Error('store.del ' + err.toString()), null);
  }
};

module.exports = store;
