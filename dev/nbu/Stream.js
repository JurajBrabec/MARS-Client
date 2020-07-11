const debug = require('debug')('Stream');
const ReadableProcess = require('../ReadableProcess');
const tables = require('../../lib/Tables');
const TransformParser = require('../TransformParser');

class Stream extends ReadableProcess {
  constructor(options = {}) {
    options.debug = options.debug ? true : false;
    if (options.debug) debug.enabled = true;
    const command = options.command;
    options = {
      ...{
        batchSize: options.batchSize || 2048,
        debug: options.debug,
        parser: command.parser,
        tables: tables.create(command.tables),
      },
      ...command.process,
    };
    super(options);
    this.result = {};
    this.tables.asBatch(this.batchSize);
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
