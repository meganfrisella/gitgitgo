const serialization = require("./serialization");
const id = require("./id");
const wire = require("./wire");

const promisifySingle = (f) => {
  return (...args) => {
    return new Promise((resolve) => {
      f(...args, (v) => resolve(v));
    });
  };
};
const promisify = (f) => {
  const isError = (e) => {
    return (
      e instanceof Error ||
      !(e === null || (typeof e === "object" && Object.keys(e).length === 0))
    );
  };
  return (...args) => {
    return new Promise((resolve, reject) => {
      f(...args, (e, v) => {
        if (isError(e)) {
          reject(e);
        } else {
          resolve(v);
        }
      });
    });
  };
};

module.exports = {
  serialize: serialization.serialize,
  deserialize: serialization.deserialize,
  id: id,
  wire: wire,
  promisify,
  promisifySingle,
};
