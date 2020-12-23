const bbPromise = require('bluebird');
const debug = require('debug')('emitterProcess');
const { execFile } = require('child_process');
const EmitterFile = require('./EmitterFile');

class EmitterProcess extends EmitterFile {
  constructor(options = {}) {
    if (options.debug) debug.enabled = true;
    options = {
      ...{ args: null, file: null, concurrency: 16, maxBuffer: Infinity },
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
    const arrArg = this.args.find((arg) => Array.isArray(arg));
    if (arrArg) {
      const stringArgs = this.args.filter((a) => a !== arrArg);
      const arrArgs = arrArg.map((arg) => [...stringArgs, arg]);
      let index = 0;
      this._source = bbPromise
        .map(
          arrArgs,
          (args) =>
            new Promise((resolve, reject) => {
              execFile(this.file, args, options, (error, stdout, stderr) => {
                if (error) return resolve(error);
                this.data(stdout);
                resolve();
              })
                .once('close', (code, signal) => debug('close', signal || code))
                .once('error', (error) => debug('error', error))
                .once('exit', (code, signal) => debug('exit', signal || code));
              index++;
              this.progress(
                Number(((100 * index) / arrArgs.length).toFixed(1))
              );
            }),
          { concurrency: this.concurrency }
        )
        .then(() => this.end())
        .catch((error) => this.error(error));
    } else {
      execFile(this.file, this.args, options, this._callback.bind(this))
        .once('close', (code, signal) => debug('close', signal || code))
        .once('error', (error) => debug('error', error))
        .once('exit', (code, signal) => debug('exit', signal || code));
    }
  }
}

module.exports = EmitterProcess;
