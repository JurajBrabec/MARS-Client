const debug = require('debug')('Stream');
const { Process } = require('../Readable');
const tables = require('../Tables');
const TransformParser = require('../TransformParser');

class Stream extends Process {
  constructor(options = {}) {
    options.debug = options.debug ? true : false;
    if (options.debug) debug.enabled = true;
    const command = options.command;
    options = {
      ...{
        batchSize: options.batchSize || 2048,
        debug: options.debug,
        description: options.command.description,
        parser: command.parser,
        tables: tables.create(command.tables),
      },
      ...command.process,
    };
    super(options);
    this.result = {};
    this.asBatch();
    this.transform = new TransformParser(options)
      .on('data', this.dataTransform.bind(this))
      .once('error', (error) => this.error(error))
      .once('finish', this.finish.bind(this))
      .debug(options.debug);
    this.pipe(this.transform);
  }
  _data(data) {
    debug('_data', data);
    if (data) {
      this.emit('data', data);
      this.tables.merge(this.result, data);
    }
  }
  asBatch(batchSize = this.batchSize) {
    debug('asBatch', batchSize);
    this.tables.asBatch(batchSize);
    return this;
  }
  data() {}
  dataTransform(data) {
    debug('data', data);
    try {
      this._data(this.tables.fromParser(data));
    } catch (error) {
      this.error(`Parsing error: ${error}`);
    }
  }
  finish() {
    debug('end');
    this._data(this.tables.end());
    super.end();
  }
}

module.exports = Stream;
