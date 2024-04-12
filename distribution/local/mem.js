const id = require('../util/id');

const mem = {};

const memStore = new Map();

const defaultCallback = (e, v) => e ? console.error(e) : console.log(v);

mem.get = function(conf, cb = defaultCallback) {
  if (!conf) {
    // TODO: this gets group-specific as well as local keys
    cb(null, Array.from(memStore.keys()));
  } else {
    let key = conf;
    if (Object.hasOwn(conf, 'gid')) {
      key = conf.gid + conf.key;
    }
    if (memStore.has(key)) {
      cb(null, memStore.get(key));
    } else {
      cb(Error('mem.get called on bad key.'), null);
    }
  }
};

mem.put = function(obj, conf, cb = defaultCallback) {
  let key = conf;
  if (!conf) {
    key = id.getID(obj);
  } else if (Object.hasOwn(conf, 'gid')) {
    key = conf.gid + conf.key;
  }
  memStore.set(key, obj);
  cb(null, obj);
};

mem.del = function(conf, cb = defaultCallback) {
  let key = conf;
  if (Object.hasOwn(conf, 'gid')) {
    key = conf.gid + conf.key;
  }
  const obj = memStore.get(key);
  if (memStore.delete(key)) {
    cb(null, obj);
  } else {
    cb(Error('mem.del called on bad key.'), null);
  }
};

// TODO: make this specific per mr instance
const mrStore = new Map();

mem.putMR = function(obj, key, cb = defaultCallback) {
  if (mrStore.has(key)) {
    mrStore.set(key, mrStore.get(key).concat(obj));
    cb(null, obj);
  } else {
    mrStore.set(key, obj);
    cb(null, obj);
  }
};

mem.getMR = function(key, cb = defaultCallback) {
  if (!key) {
    cb(null, Array.from(mrStore.keys()));
  } else {
    if (mrStore.has(key)) {
      cb(null, mrStore.get(key));
    } else {
      cb(Error('mem.getMR called on bad key.'), null);
    }
  }
};

module.exports = mem;
