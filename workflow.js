global.nodeConfig = {ip: '127.0.0.1', port: 7070};
const distribution = require('./distribution');
const id = distribution.util.id;
const {substituteLiterals} = distribution.util.wire;

const groupsTemplate = require('./distribution/all/groups');
let localServer = null;

const group = {};
const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};

group[id.getSID(n1)] = n1;
group[id.getSID(n2)] = n2;
group[id.getSID(n3)] = n3;

const startNodes = (cb) => {
  distribution.local.status.spawn(n1, (e, v) => {
    distribution.local.status.spawn(n2, (e, v) => {
      distribution.local.status.spawn(n3, (e, v) => {
        cb();
      });
    });
  });
};

const shutdown = (cb) => {
  let remote = {service: 'status', method: 'stop'};
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        if (localServer !== null) {
          localServer.close();
        }
        cb();
      });
    });
  });
};

const promiseAll = (promises, cb) => {
  let n = promises.length;
  if (n === 0) {
    return cb(null, []);
  }
  let errors = [];
  let values = [];
  promises.forEach((promise) => {
    promise((e, v) => {
      if (e) {
        errors.push(e);
      }
      values.push(v);
      n--;
      if (n === 0) {
        errors = errors.length > 0 ? errors : null;
        return cb(errors, values);
      }
    });
  });
};

const addDataset = (groupName, data, cb) => {
  const config = {gid: groupName};
  return groupsTemplate(config).put(config, group, (e, v) => {
    return promiseAll(Object.entries(data).map(([key, value]) => (cb) => {
      distribution[groupName].store.put(value, key, cb);
    }), cb);
  });
};

const datasets = {
  'crawler': {
    0: 'http://cs.brown.edu/courses/csci1380/sandbox/1/index.html',
    1: 'http://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html',
    2: 'http://cs.brown.edu/courses/csci1380/sandbox/1/level_1b/index.html',
    3: 'http://cs.brown.edu/courses/csci1380/sandbox/1/level_1c/index.html',
  },
  'extractURL': {
    'http://cs.brown.edu/courses/csci1380/sandbox/1/': `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Home Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #333;
            text-align: center;
        }

        .container {
            max-width: 800px;
            margin: auto;
            padding: 20px;
        }

        h1 {
            color: #4CAF50;
        }

        a {
            color: #5D4037;
            text-decoration: none;
            font-size: 1.2em;
        }

        a:hover {
            color: #FF5722;
        }

        .footer {
            margin-top: 30px;
            padding: 10px;
            background-color: #3F51B5;
            color: white;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to CS1380 simple links</h1>
        <p>Check out my <a href="level_1a/index.html">Some stuff</a>.</p>
        <p>Check out my <a href="level_1b/index.html">Some more stuff</a>.</p>
<p>Check out a few <a href="level_1c/index.html">Some more more stuff</a>.</p>
    </div>
    <div class="footer">
        <p>2023 CS1380. All rights reserved.</p>
    </div>
</body>
</html>
`,
    'http://cs.brown.edu/courses/csci1380/sandbox/1/level_1c/index.html': `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Home Page</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
                color: #333;
                text-align: center;
            }

            .container {
                max-width: 800px;
                margin: auto;
                padding: 20px;
            }

            h1 {
                color: #4CAF50;
            }

            a {
                color: #5D4037;
                text-decoration: none;
                font-size: 1.2em;
            }

            a:hover {
                color: #FF5722;
            }

            .footer {
                margin-top: 30px;
                padding: 10px;
                background-color: #3F51B5;
                color: white;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Welcome to CS1380 simple links</h1>
            <p>Check out <a href="fact_5/index.html">fact 5</a>.</p>
            <p>Check out <a href="fact_6/index.html">fact 6</a>.</p>
        </div>
        <div class="footer">
            <p> 2023 CS1380. All rights reserved.</p>
        </div>
    </body>
    </html>`,
  },
  'stringMatch': {
    'abc': 1,
    'def': 2,
    'ghi': 3,
    'a': 4,
    'b': 5,
    'c': 6,
  },
  'reverseGraph': {
    0: ['http://cs.brown.edu/courses/csci1380/sandbox/1/level_1c/index.html', 'http://cs.brown.edu/courses/csci1380/sandbox/1/index.html'],
    1: ['http://cs.brown.edu/courses/csci1380/sandbox/1/level_1b/index.html', 'http://cs.brown.edu/courses/csci1380/sandbox/1/index.html'],
    2: ['http://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html', 'http://cs.brown.edu/courses/csci1380/sandbox/1/index.html'],
    3: ['http://cs.brown.edu/courses/csci1380/sandbox/2/level_1a/index.html', 'http://cs.brown.edu/courses/csci1380/sandbox/2/index.html'],
    4: ['http://cs.brown.edu/courses/csci1380/sandbox/1/index.html', 'http://cs.brown.edu/courses/csci1380/sandbox/index.html'],
    5: ['http://cs.brown.edu/courses/csci1380/sandbox/2/index.html', 'http://cs.brown.edu/courses/csci1380/sandbox/index.html'],
  },
};

datasets['invertedIndex'] = datasets['extractURL'];

const setupDatasets = (cb) => {
  return promiseAll(Object.entries(datasets).map(([key, value]) => (cb) => {
    addDataset(key, value, cb);
  }), cb);
};

const crawler = (keys, cb) => {
  const map = (key, value) => {
    const http = require('http');
    http.get(value, (res) => {
      let data = [];
      res.on('data', (chunk) => {
        data.push(chunk);
      });

      res.on('end', () => {
        distribution['crawler'].store.put(data, `${key}-download`);
      });
    });

    const o = {};
    o[key] = `${key}-download`;
    return o;
  };

  const reduce = (key, values) => {
    const o = {};
    o[key] = values[0];
    return o;
  };

  const config = {
    map,
    reduce,
    keys,
    memory: true,
  };

  distribution['crawler'].mr.exec(config, (e, v) => {
    console.log(v);
    cb(console.log);
  });
};

const extractURL = (keys, cb) => {
  const map = (key, value) => {
    const {JSDOM} = require('jsdom');
    const {resolve} = require('url');
    const dom = new JSDOM(value);
    const output = [];
    for (const anchor of dom.window.document.querySelectorAll('a').values()) {
      const o = {};
      const url = resolve(key, anchor.href);
      o[url] = 0;
      output.push(o);
    }
    return output;
  };

  const reduce = (key, values) => {
    const o = {};
    o[key] = key;
    return o;
  };

  const config = {
    map,
    reduce,
    keys,
    memory: true,
  };

  distribution['extractURL'].mr.exec(config, (e, v) => {
    console.log(v);
    cb(console.log);
  });
};

const stringMatch = (keys, regex, cb) => {
  let map = (key, value) => {
    const regex = __REGEX__;

    const output = [];
    if (regex.test(key)) {
      const o = {};
      o[key] = value;
      output.push(o);
    }
    return output;
  };
  map = substituteLiterals(map, {__REGEX__: regex.toString()});
  console.log(map.toString());

  const reduce = (key, values) => {
    const o = {};
    o[key] = values[0];
    return o;
  };

  const config = {
    map,
    reduce,
    keys,
    memory: true,
  };

  distribution['stringMatch'].mr.exec(config, (e, v) => {
    console.log(v);
    cb(console.log);
  });
};

const invertedIndex = (keys, cb) => {
  const map = (key, value) => {
    const output = [];
    value.replaceAll('\n', ' ').split(' ')
        .filter((word) => word.length > 0)
        .forEach((word) => {
          const o = {};
          o[word] = key;
          output.push(o);
        });
    return output;
  };

  const reduce = (key, values) => {
    const o = {};
    o[key] = Array.from(new Set(values));
    return o;
  };

  const config = {
    map,
    reduce,
    keys,
    memory: true,
  };

  // recycle the same dataset
  distribution['invertedIndex'].mr.exec(config, (e, v) => {
    console.log(v);
    cb(console.log);
  });
};

const reverseGraph = (keys, cb) => {
  const map = (key, value) => {
    const src = value[0];
    const sink = value[1];
    const o = {};
    o[sink] = src;
    return o;
  };

  const reduce = (key, values) => {
    const o = {};
    o[key] = values;
    return o;
  };

  const config = {
    map,
    reduce,
    keys,
    memory: true,
  };

  distribution['reverseGraph'].mr.exec(config, (e, v) => {
    console.log(v);
    cb(console.log);
  });
};

shutdown(() => {
  distribution.node.start((server) => {
    localServer = server;

    startNodes(() => {
      setupDatasets(() => {
        crawler(Object.keys(datasets['crawler']), () => {
          extractURL(Object.keys(datasets['extractURL']), () => {
            stringMatch(Object.keys(datasets['stringMatch']), /a|b|c/, () => {
              invertedIndex(Object.keys(datasets['invertedIndex']), () => {
                reverseGraph(Object.keys(datasets['reverseGraph']), shutdown);
              });
            });
          });
        });
      });
    });
  });
});
