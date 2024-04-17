var serialization = require("../util/serialization");
var crypto = require("crypto");
const assert = require("assert");

// The ID is the SHA256 hash of the JSON representation of the object
function getID(obj) {
  const hash = crypto.createHash("sha256");
  hash.update(serialization.serialize(obj));
  return hash.digest("hex");
}

// The NID is the SHA256 hash of the JSON representation of the node
function getNID(node) {
  if (node.nid) return node.nid;
  node = { ip: node.ip, port: node.port };
  return getID(node);
}

// The SID is the first 5 characters of the NID
function getSID(node) {
  return getNID(node).substring(0, 5);
}

const hexToModuloN = (hex, n) => {
  let result = 0;

  // Process each character in the hex string
  for (let i = 0; i < hex.length; i++) {
    let char = hex[i];

    let digitValue = parseInt(char, 16);

    result = (result * 16 + digitValue) % n;
  }

  return result;
};

function idToNum(id) {
  let n = BigInt("0x" + id);
  return n;
}

function naiveHash(kid, nids) {
  return nids[idToNum(kid) % BigInt(nids.length)];
}

function consistentHash(kid, nids) {
  numKID = idToNum(kid);
  const map = new Map();
  const ids = nids.map((nid) => {
    const num = idToNum(nid);
    map.set(num, nid);
    return num;
  });
  ids.push(numKID);
  ids.sort();
  const idx = ids.indexOf(numKID);
  let nid;
  if (idx == ids.length - 1) {
    nid = ids[0];
  } else {
    nid = ids[idx + 1];
  }
  return map.get(nid);
}

function rendezvousHash(kid, nids) {
  const map = new Map();
  const ids = nids.map((nid) => {
    const num = idToNum(getID(kid + nid));
    map.set(num, nid);
    return num;
  });
  ids.sort();
  return map.get(ids[ids.length - 1]);
}

module.exports = {
  getNID: getNID,
  getSID: getSID,
  getID: getID,
  idToNum: idToNum,
  naiveHash: naiveHash,
  consistentHash: consistentHash,
  rendezvousHash: rendezvousHash,
};
