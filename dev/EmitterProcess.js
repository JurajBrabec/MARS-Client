const debug = require('debug')('emitterProcess');
const { execFile } = require('child_process');
const EmitterFile = require('./EmitterFile');

class EmitterProcess extends EmitterFile {
  constructor(options = {}) {
    if (options.debug) debug.enabled = true;
    options = {
      ...{ args: null, file: null, maxBuffer: Infinity },
      ...options,
    };
    super(options);
    return this;
  }
  _run(...args) {
    debug('_run', args);
    const options = {
      encoding: this.encoding,
      maxBuffer: this.maxBuffer,
    };
    execFile(this.file, this.args, options, this._callback.bind(this))
      .once('close', (code, signal) => debug('close', signal || code))
      .once('error', (error) => debug('error', error))
      .once('exit', (code, signal) => debug('exit', signal || code));
  }
}

module.exports = EmitterProcess;
