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

const getStoreDir = (gid, col) => {
  gid = gid || 'local';
  col = col || 'default';
  return path.join(nodeDir, gid, col);
}
const getFilePath = (gid, col, key) => path.join(getStoreDir(gid, col), btoa(key));

fs.mkdirSync(nodeDir, { recursive: true });

store.get = function (conf, cb = defaultCallback) {
  const key = conf.key || null;
  const dir = getStoreDir(conf.gid, conf.col);
  if (!key) {
    try {
      const files = fs.readdirSync(dir).map(atob);
      cb(null, files);
    } catch (err) {
      cb(new Error('store.get ' + err.toString()), null);
    }
  } else {
    const file = getFilePath(conf.gid, conf.col, key);
    try {
      const data = fs.readFileSync(file).toString();
      const substrings = data.split('\n');
      if (substrings.length > 1) {
        cb(null, substrings.slice(0, -1).map(serialization.deserialize));
      } else {
        cb(null, serialization.deserialize(data));
      }
    } catch (err) {
      cb(new Error('store.get ' + err.toString()), null);
    }
  }
};

store.put = function (obj, conf, cb = defaultCallback) {
  let key = conf.key || null;
  if (!key) {
    key = id.getID(obj);
  }
  const file = getFilePath(conf.gid, conf.col, key);
  console.log(file)
  try {
    fs.writeFileSync(file, serialization.serialize(obj));
    cb(null, obj);
  } catch (err) {
    cb(new Error('store.put ' + err.toString()), null);
  }
};

store.append = function (obj, conf, cb = defaultCallback) {
  let key = conf.key || null;
  if (!key) {
    key = id.getID(obj);
  } 
  const file = getFilePath(conf.gid, conf.col, key);
  const data = serialization.serialize(obj);
  try {
    fs.appendFileSync(file, data + '\n');
    cb(null, obj);
  } catch (err) {
    cb(new Error('store.append ' + err.toString()), null);
  }
};

store.del = function (conf, cb = defaultCallback) {
  const file = getFilePath(conf.gid, conf.col, conf.key);
  try {
    let data = fs.readFileSync(file);
    fs.rmSync(file);
    cb(null, serialization.deserialize(data));
  } catch (err) {
    cb(new Error('store.del ' + err.toString()), null);
  }
};

module.exports = store;
