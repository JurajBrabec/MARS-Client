const path = require('path');
const { Actions } = require('../TextParser');
const { Column, Row, Set } = Actions;

class Clients {
  constructor(nbu) {
    this.process = {
      file: path.join(nbu.bin, 'admincmd', 'bpplclients.exe'),
      args: ['-allunique', '-l'],
    };
    this.parser = [
      Set.delimiter(/\r?\n/),
      Set.separator(' '),
      Column.expect(/^CLIENT/),
      Row.split(),
      Column.filter(''),
      Column.separate(),
      Column.filter('CLIENT'),
      Column.replace(['*NULL*', null]),
      Row.expect(7),
    ];
    this.tables = {
      bpplclients: [
        { masterServer: nbu.masterServer, key: true },
        { name: 'string', key: true },
        { architecture: 'string' },
        { os: 'string' },
        { priority: 'number' },
        { u1: 'number' },
        { u2: 'number' },
        { u3: 'number' },
        { updated: nbu.startTime },
        { obsoleted: null },
      ],
    };
  }
}

module.exports = { Clients };
