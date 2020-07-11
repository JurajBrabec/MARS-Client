const debug = require('debug')('Transform');
const { Transform } = require('stream');
const { StringDecoder } = require('string_decoder');
const { Parser } = require('./TextParser');

class TransformParser extends Transform {
  constructor(options = {}) {
    if (options.debug) debug.enabled = true;
    options = {
      ...{
        defaultEncoding: 'utf8',
        encoding: 'utf8',
        highWaterMark: 64 * 1024,
        path: null,
      },
      ...options,
      ...{ objectMode: false },
    };
    super(options);
    this._parser = new Parser(options.parser).debug(options.debug);
    this._decoder = new StringDecoder(options.defaultEncoding);
    this.on('data', (chunk) => debug('>data', chunk))
      .once('error', (error) => debug('>error', error.message || error))
      .once('end', () => debug('>end'))
      .once('finish', () => debug('>finish'));
  }
  _transform(chunk, encoding, callback) {
    if (encoding === 'buffer') {
      chunk = this._decoder.write(chunk);
    }
    debug('chunk', chunk);
    try {
      const result = this._parser.bufferText(chunk);
      if (result) this.push(result);
      callback();
    } catch (error) {
      callback(error);
    }
  }
  _flush(callback) {
    debug('final');
    try {
      const result = this._parser.end();
      if (result) this.push(result);
      callback();
    } catch (error) {
      callback(error);
    }
  }
  debug(enabled) {
    debug.enabled = enabled;
    return this;
  }
}

module.exports = TransformParser;
