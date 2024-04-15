const http = require("http");
const serialization = require("../util/serialization");

const comm = {};

const defaultCallback = (e, v) => (e ? console.error(e) : console.log(v));

comm.send = function (msg, rem, cb = defaultCallback) {
  const options = {
    host: rem.node.ip,
    port: rem.node.port,
    path: "/" + rem.service + "/" + rem.method,
    method: "PUT",
  };
  const msgSer = serialization.serialize(msg);
  const req = http.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      const [e, v] = serialization.deserialize(data);
      cb(e, v);
    });
  });
  req.on("error", (err) => {
    cb(new Error("failed to connect to node."), null);
  });
  req.write(msgSer);
  req.end();
};

module.exports = comm;
