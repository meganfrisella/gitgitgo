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

fs.mkdirSync(nodeDir, { recursive: true });

store.get = function (conf, cb = defaultCallback) {
  let key = conf.key || null;
  let gid = conf.gid || 'local';
  let col = conf.col || 'default';
  let dir = path.join(nodeDir, gid, col);
  if (!key) {
    try {
      let files = fs.readdirSync(dir);
      cb(null, files);
    } catch (err) {
      cb(new Error('store.get ' + err.toString()), null);
    }
  } else {
    try {
      let data = fs.readFileSync(path.join(dir, key));
      console.log("HERE", path.join(dir, key));
      cb(null, serialization.deserialize(data));
    } catch (err) {
      cb(new Error('store.get ' + err.toString()), null);
    }
  }
};

store.put = function (obj, conf, cb = defaultCallback) {
  let key = conf.key || null;
  let gid = conf.gid || 'local';
  let col = conf.col || 'default';
  let dir = path.join(nodeDir, gid, col);
  if (!key) {
    key = id.getID(obj);
  }
  try {
    fs.writeFileSync(path.join(dir, key), serialization.serialize(obj));
    cb(null, obj);
  } catch (err) {
    cb(new Error('store.put ' + err.toString()), null);
  }
};

store.del = function (conf, cb = defaultCallback) {
  let key = conf.key || null;
  let gid = conf.gid || 'local';
  let col = conf.col || 'default';
  let dir = path.join(nodeDir, gid, col, key);
  try {
    let data = fs.readFileSync(dir);
    try {
      fs.rmSync(dir);
      cb(null, serialization.deserialize(data));
    } catch (err) {
      cb(new Error('store.del ' + err.toString()), null);
    }
  } catch (err) {
    cb(new Error('store.del ' + err.toString()), null);
  }
};

module.exports = store;
