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

const fs = require("fs");
const path = require("path");
const id = require("../util/id");
const serialization = require("../util/serialization");

const store = {};

const defaultCallback = (e, v) => (e ? console.error(e) : console.log(v));

const nodeDir = path.join(__dirname, "../../store", global.moreStatus.sid);
const seenDirs = new Set();

const getStoreDir = (gid, col) => {
  gid = gid || "local";
  col = col || "default";
  return path.join(nodeDir, gid, col);
};
const getFilePath = (gid, col, key) =>
  path.join(getStoreDir(gid, col), btoa(key));
const ensureDirExists = (dir) => {
  if (seenDirs.has(dir)) return;
  seenDirs.add(dir);
  fs.mkdirSync(dir, { recursive: true });
};

fs.mkdirSync(nodeDir, { recursive: true });

store.get = function (conf, cb = defaultCallback) {
  const key = conf.key || null;
  const dir = getStoreDir(conf.gid, conf.col);
  if (!key) {
    ensureDirExists(dir);
    try {
      const files = fs.readdirSync(dir).map(atob);
      cb(null, files);
    } catch (err) {
      cb(new Error("store.get " + err.toString()), null);
    }
  } else {
    const file = getFilePath(conf.gid, conf.col, key);
    try {
      const data = fs.readFileSync(file).toString();
      const substrings = data.split("\n");
      if (substrings.length > 1) {
        cb(null, substrings.slice(0, -1).map(serialization.deserialize));
      } else {
        cb(null, serialization.deserialize(data));
      }
    } catch (err) {
      cb(new Error("store.get " + err.toString()), null);
    }
  }
};

store.put = function (obj, conf, cb = defaultCallback) {
  let key = conf.key || null;
  if (!key) {
    key = id.getID(obj);
  }
  const file = getFilePath(conf.gid, conf.col, key);
  ensureDirExists(path.dirname(file));
  const serialized = Array.isArray(obj)
    ? obj.map(serialization.serialize).join("\n") + "\n"
    : serialization.serialize(obj);
  try {
    fs.writeFileSync(file, serialized);
    cb(null, obj);
  } catch (err) {
    cb(new Error("store.put " + err.toString()), null);
  }
};

store.append = function (obj, conf, cb = defaultCallback) {
  // it doesn't make sense to auto-compute a key for append, so it should
  // be required
  let key = conf.key;
  const file = getFilePath(conf.gid, conf.col, key);
  ensureDirExists(path.dirname(file));
  const data = serialization.serialize(obj);
  try {
    fs.appendFileSync(file, data + "\n");
    cb(null, null);
  } catch (err) {
    cb(new Error("store.append " + err.toString()), null);
  }
};

store.extend = function (objs, conf, cb = defaultCallback) {
  // it doesn't make sense to auto-compute a key for extend, so it should
  // be required
  let key = conf.key;
  const file = getFilePath(conf.gid, conf.col, key);
  ensureDirExists(path.dirname(file));
  const serialized = objs.map(serialization.serialize).join("\n") + "\n";
  try {
    fs.appendFileSync(file, serialized);
    cb(null, null);
  } catch (err) {
    cb(new Error("store.append " + err.toString()), null);
  }
};

store.del = function (conf, cb = defaultCallback) {
  const file = getFilePath(conf.gid, conf.col, conf.key);
  try {
    let data = fs.readFileSync(file);
    fs.rmSync(file);
    cb(null, serialization.deserialize(data));
  } catch (err) {
    cb(new Error("store.del " + err.toString()), null);
  }
};

module.exports = store;
