const debug = require('debug')('Readable');
const { PassThrough } = require('stream');
const Emitter = require('./Emitter');

class Readable extends Emitter {
  constructor(options = {}) {
    if (options.debug) debug.enabled = true;
    const destroy = options.destroy;
    const read = options.read;
    delete options.destroy;
    delete options.read;
    super(options);
    if (destroy) this._destroy = destroy;
    if (read) this._read = read;
    this._stream = new PassThrough({
      ...options,
      ...{ destroy: this._destroy.bind(this), read: this._read.bind(this) },
    });
    this.result = undefined;
    return this;
  }

  _destroy(error, callback) {
    debug('_destroy', error);
    if (callback) callback(error);
  }
  _read(size) {
    debug('_read', size);
    this.push('test'); // this.error("test");
    this.push(null); // this.end();
  }
  data(...data) {
    super.data(...data);
    this.result = undefined;
  }
  destroy(error) {
    debug('destroy', error);
    this._stream.destroy(error);
  }
  end() {
    if (!this._stream.readableEnded) return this.push(null);
    this.result = this.status;
    super.end();
  }
  error(error) {
    if (!this._stream.readableEnded) this.destroy(error);
    super.error(error);
  }
  pipe(destination, options) {
    debug('pipe', destination.constructor, options);
    destination
      .once('end', (status) => this.end(status))
      .once('error', (error) => this.error(error.message || error));
    return this._stream.pipe(destination, options);
  }
  push(chunk, encoding) {
    debug('push', chunk, encoding);
    this._stream.push(chunk, encoding);
  }
  run(...args) {
    debug('run', args);
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      try {
        this.progress(0);
        this._stream
          //          .once("close", () => debug(">close"))
          //          .on("data", (chunk) => debug(">data", chunk))
          //          .once("error", (error) => debug(">error", error.message || error))
          //          .once("end", () => debug(">end"))
          .on('resume', () => debug('>resume'))
          .once('close', () => this.end())
          .on('data', (chunk) => this.data(chunk))
          .once('end', () => this.end())
          .once('error', (error) => this.error(error));
      } catch (error) {
        this.error(error);
      }
    });
  }
}

module.exports = Readable;
