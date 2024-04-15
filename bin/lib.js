const distribution = require("../distribution");
const groupsTemplate = require("../distribution/all/groups");
const id = require("../distribution/util/id");
const fs = require("fs");

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

const start = (nodesConfigPath, main) => {
  const groupName = "main";
  const config = JSON.parse(fs.readFileSync(nodesConfigPath));
  const group = {};
  config.forEach((n) => {
    group[id.getSID(n)] = n;
  });
  const groupConfig = {
    gid: groupName,
  };
  distribution.node.start((server) => {
    promisify(groupsTemplate(groupConfig).put)(groupConfig, group)
      .then((v) => {
        main(server);
      })
      .catch(console.error);
  });
};

module.exports = {
  promisify,
  start,
};
