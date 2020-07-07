const path = require('path');
const { Actions } = require('../TextParser');
const { Column, Row, Set } = Actions;

class Retlevels {
  constructor(nbu) {
    this.process = {
      file: path.join(nbu.bin, 'admincmd', 'bpretlevel.exe'),
      args: ['-L'],
    };
    this.parser = [
      Set.delimiter(/\r?\n/),
      Column.trim(),
      Column.expect(/^Retention/),
      Row.split(),
      Column.trim(),
      Column.filter(/^\D/),
      Column.replace([/\(|\)/g, '']),
      Column.split(/ (?=\d+|expires|infinite)/),
      Column.trim(),
      Row.expect(4),
    ];
    this.tables = {
      bpretlevel: [
        { masterServer: nbu.masterServer, key: true },
        { level: 'number', key: true },
        { days: 'number' },
        { seconds: 'number' },
        { period: 'string' },
      ],
    };
  }
}

module.exports = { Retlevels };
