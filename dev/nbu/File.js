const debug = require('debug')('File');
const EmitterFile = require('../EmitterFile');
const { Parser } = require('../TextParser');
const tables = require('../../lib/Tables');

class File extends EmitterFile {
  constructor(options = {}) {
    options.debug = options.debug ? true : false;
    if (options.debug) debug.enabled = true;
    options = {
      ...{
        debug: options.debug,
        parser: new Parser(options.command.parser).debug(options.debug),
        tables: tables.create(options.command.tables),
      },
      ...options.command.file,
    };
    super(options);
    this.result = {};
  }
  asBatch(batchSize = 1) {
    debug('asBatch', batchSize);
    tables.asBatch(batchSize);
    return this;
  }
  _data(data) {
    debug('_data', data);
    if (data) {
      this.emit('data', data);
      this.tables.merge(this.result, data);
    }
  }
  data(...data) {
    data = data.join('');
    debug('data', data);
    try {
      this._data(this.tables.fromParser(this.parser.parseText(data)));
    } catch (error) {
      this.error(`Parsing error: ${error}`);
    }
  }
  end() {
    debug('end');
    this._data(this.tables.end());
    super.end();
  }
}

module.exports = File;
