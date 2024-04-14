global.nodeConfig = {ip: '127.0.0.1', port: 7070};
const distribution = require('../distribution');
const fs = require('fs');
const path = require('path');
const id = distribution.util.id;
const groupsTemplate = require('../distribution/all/groups');


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

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};
const testGroup = {};

afterEach(() => {
  fs.rmdirSync(path.join(path.dirname(__dirname), './store'), {recursive: true});
});

beforeAll((done) => {
  fs.rmdirSync(path.join(path.dirname(__dirname), './store'), {recursive: true});

  testGroup[id.getSID(n1)] = n1;
  testGroup[id.getSID(n2)] = n2;
  testGroup[id.getSID(n3)] = n3;

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

    const testConfig = {gid: 'test'};
    startNodes(() => {
      groupsTemplate(testConfig).put(testConfig, testGroup, (e, v) => {
        done();
      });
    });
  });
});

afterAll((done) => {
  let remote = {service: 'status', method: 'stop'};
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

test('local.store.append', () => {
  distribution.local.store.append('obj', {
    key: 'key',
    col: 'test',
  }, (e, v) => {
    expect(e).toBeFalsy();
    distribution.local.store.append(['obj2', 'obj3'], {
      key: 'key',
      col: 'test',
    }, (e, v) => {
      expect(e).toBeFalsy();
      distribution.local.store.get({key: 'key', col: 'test'}, (e, v) => {
        expect(e).toBeFalsy();
        expect(v).toEqual(['obj', ['obj2', 'obj3']]);
      });
    });
  });
});

test('local.store.append: different collections', (done) => {
  distribution.local.store.append('obj', {
    key: 'key',
    col: 'test2',
  }, (e, v) => {
    expect(e).toBeFalsy();
    distribution.local.store.append(['obj2', 'obj3'], {
      key: 'key',
      col: 'test3',
    }, (e, v) => {
      expect(e).toBeFalsy();
      distribution.local.store.get({key: 'key', col: 'test3'}, (e, v) => {
        expect(e).toBeFalsy();
        expect(v).toEqual([['obj2', 'obj3']]);
        distribution.local.store.get({key: 'key', col: 'test2'}, (e, v) => {
          expect(e).toBeFalsy();
          expect(v).toEqual(['obj']);
          distribution.local.store.get({key: 'key', col: 'doesnotexist'}, (e, v) => {
            expect(e).toBeTruthy();
            done();
          });
        });
      });
    });
  });
});

test('local.store.extend', () => {
  distribution.local.store.extend(['obj'], {
    key: 'key',
    col: 'test',
  }, (e, v) => {
    expect(e).toBeFalsy();
    distribution.local.store.append(['obj2', 'obj3'], {
      key: 'key',
      col: 'test',
    }, (e, v) => {
      expect(e).toBeFalsy();
      distribution.local.store.get({key: 'key', col: 'test'}, (e, v) => {
        expect(e).toBeFalsy();
        expect(v).toEqual(['obj', 'obj2', 'obj3']);
      });
    });
  });
});

test('local.store.extend: different collections', (done) => {
  distribution.local.store.extend(['obj'], {
    key: 'key',
    col: 'test2',
  }, (e, v) => {
    expect(e).toBeFalsy();
    distribution.local.store.extend(['obj2', 'obj3'], {
      key: 'key',
      col: 'test3',
    }, (e, v) => {
      expect(e).toBeFalsy();
      distribution.local.store.get({key: 'key', col: 'test3'}, (e, v) => {
        expect(e).toBeFalsy();
        expect(v).toEqual(['obj2', 'obj3']);
        distribution.local.store.get({key: 'key', col: 'test2'}, (e, v) => {
          expect(e).toBeFalsy();
          expect(v).toEqual(['obj']);
          distribution.local.store.get({key: 'key', col: 'doesnotexist'}, (e, v) => {
            expect(e).toBeTruthy();
            done();
          });
        });
      });
    });
  });
});

test('local.store.extend and local.store.append', (done) => {
  distribution.local.store.append('obj', {
    key: 'key',
    col: 'test',
  }, (e, v) => {
    expect(e).toBeFalsy();
    distribution.local.store.extend(['obj2', 'obj3'], {
      key: 'key',
      col: 'test',
    }, (e, v) => {
      expect(e).toBeFalsy();
      distribution.local.store.get({key: 'key', col: 'test'}, (e, v) => {
        expect(e).toBeFalsy();
        expect(v).toEqual(['obj', 'obj2', 'obj3']);
        done();
      });
    });
  });
});

test('local.store.append and local.store.extend', (done) => {
  distribution.local.store.append('obj', {
    key: 'key',
    col: 'test',
  }, (e, v) => {
    expect(e).toBeFalsy();
    distribution.local.store.extend(['obj2', 'obj3'], {
      key: 'key',
      col: 'test',
    }, (e, v) => {
      expect(e).toBeFalsy();
      distribution.local.store.get({key: 'key', col: 'test'}, (e, v) => {
        expect(e).toBeFalsy();
        expect(v).toEqual(['obj', 'obj2', 'obj3']);
        done();
      });
    });
  });
});

test('local.store.put and local.store.append', (done) => {
  distribution.local.store.put(['obj', 'obj2'], {
    key: 'key',
    col: 'test',
  }, (e, v) => {
    expect(e).toBeFalsy();
    distribution.local.store.append('obj3', {
      key: 'key',
      col: 'test',
    }, (e, v) => {
      expect(e).toBeFalsy();
      distribution.local.store.get({key: 'key', col: 'test'}, (e, v) => {
        expect(e).toBeFalsy();
        expect(v).toEqual(['obj', 'obj2', 'obj3']);
        done();
      });
    });
  });
});

test('all.store.append', (done) => {
  distribution.test.store.append('obj', {
    key: 'key',
    col: 'test',
  }, (e, v) => {
    expect(e).toBeFalsy();
    distribution.test.store.append(['obj2', 'obj3'], {
      key: 'key',
      col: 'test'
    }, (e, v) => {
      expect(e).toBeFalsy();
      distribution.test.store.get({key: 'key', col: 'test'}, (e, v) => {
        expect(e).toBeFalsy();
        expect(v).toEqual(['obj', ['obj2', 'obj3']]);
        distribution.test.store.get({key: 'key'}, (e, v) => {
          expect(e).toBeTruthy();
          done();
        });
      });
    });
  });
});



test('all.store.extend', (done) => {
  distribution.test.store.extend(['obj'], {
    key: 'key',
    col: 'test',
  }, (e, v) => {
    expect(e).toBeFalsy();
    distribution.test.store.extend(['obj2', 'obj3'], {
      key: 'key',
      col: 'test'
    }, (e, v) => {
      expect(e).toBeFalsy();
      distribution.test.store.get({key: 'key', col: 'test'}, (e, v) => {
        expect(e).toBeFalsy();
        expect(v).toEqual(['obj', 'obj2', 'obj3']);
        distribution.test.store.get({key: 'key'}, (e, v) => {
          expect(e).toBeTruthy();
          done();
        });
      });
    });
  });
});

test('all.store.get(null)', (done) => {
  distribution.test.store.put('obj1', {
    key: 'key1',
    col: 'test',
  }, (e, v) => {
    expect(e).toBeFalsy();
    distribution.test.store.put('obj2', {
      key: 'key2',
      col: 'test',
    }, (e, v) => {
      expect(e).toBeFalsy();
      distribution.test.store.put('obj3', {
        key: 'key3',
        col: 'test',
      }, (e, v) => {
        expect(e).toBeFalsy();
        distribution.test.store.get({
          key: null,
          col: 'test',
        }, (e, v) => {
          expect(e).toBeFalsy();
          v.sort();
          expect(v).toEqual(['key1', 'key2', 'key3']);
          done();
        });
      });
    });
  });
});
