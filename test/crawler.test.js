global.nodeConfig = { ip: '127.0.0.1', port: 7070 };
const distribution = require('../distribution');
const crawler = require('../crawler')
const id = distribution.util.id;

const groupsTemplate = require('../distribution/all/groups');

const ncdcGroup = {};
const dlibGroup = {};

/*
   This hack is necessary since we can not
   gracefully stop the local listening node.
   The process that node is
   running in is the actual jest process
*/
let localServer = null;

/*
    The local node will be the orchestrator.
*/

const n1 = { ip: '127.0.0.1', port: 7110 };
const n2 = { ip: '127.0.0.1', port: 7111 };
const n3 = { ip: '127.0.0.1', port: 7112 };

beforeAll((done) => {
  /* Stop the nodes if they are running */

  ncdcGroup[id.getSID(n1)] = n1;
  ncdcGroup[id.getSID(n2)] = n2;
  ncdcGroup[id.getSID(n3)] = n3;

  dlibGroup[id.getSID(n1)] = n1;
  dlibGroup[id.getSID(n2)] = n2;
  dlibGroup[id.getSID(n3)] = n3;

  const startNodes = (cb) => {
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          cb();
        });
      });
    });
  };

  distribution.node.start((server) => {
    localServer = server;

    const ncdcConfig = { gid: 'ncdc' };
    startNodes(() => {
      groupsTemplate(ncdcConfig).put(ncdcConfig, ncdcGroup, (e, v) => {
        const dlibConfig = { gid: 'dlib' };
        groupsTemplate(dlibConfig).put(dlibConfig, dlibGroup, (e, v) => {
          done();
        });
      });
    });
  });
});

afterAll((done) => {
  let remote = { service: 'status', method: 'stop' };
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        localServer.close();
        done();
      });
    });
  });
});

test('crawl', (done) => {
  let dataset = [
    {1: 'https://raw.githubusercontent.com/brown-cs1380/m1/main/README.md'}, 
    {2: 'https://raw.githubusercontent.com/brown-cs1380/m2/main/README.md'}, 
    {3: 'https://raw.githubusercontent.com/brown-cs1380/m3/main/README.md'},
  ];

  const doMapReduce = (cb) => {
    distribution.ncdc.store.get({ key: null }, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }

      crawler(v, 'ncdc', (e, v) => {
        console.log(e)
        console.log(v)
        done();
      })
    });
  };

  let cntr = 0;
  // We send the dataset to the cluster
  dataset.forEach((o) => {
    let key = Object.keys(o)[0];
    let value = o[key];
    distribution.ncdc.store.put(value, { key: key }, (e, v) => {
      cntr++;
      // Once we are done, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});