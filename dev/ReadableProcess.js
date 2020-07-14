const bbPromise = require('bluebird');
const debug = require('debug')('ReadableProcess');
const { spawn } = require('child_process');
const ReadableFile = require('./ReadableFile');

class ReadableProcess extends ReadableFile {
  constructor(options = {}) {
    if (options.debug) debug.enabled = true;
    options = {
      ...{ args: null, file: null, concurrency: 16, maxBuffer: Infinity },
      ...options,
    };
    super(options);
    return this;
  }
  _read(size) {
    if (this._source) return;
    debug('_read', size);
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
              const proc = spawn(this.file, args, options)
                .once('close', () => resolve())
                .once('error', (error) => reject(error));
              proc.stderr.pipe(proc.stdout);
              proc.stdout.on('data', (chunk) => this.push(chunk));
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
      this._source = spawn(this.file, this.args, options)
        .once('close', (code, signal) => debug('close', signal || code))
        .once('disconnect', () => debug('disconnect'))
        .once('error', (error) => debug('error', error))
        .once('exit', (code, signal) => debug('exit', signal || code))
        .on('message', (message) => debug('message', message))
        .once('close', () => this.end())
        .once('error', (error) => this.error(error));
      this._source.stderr.pipe(this._source.stdout);
      this._source.stdout.on('data', (chunk) => this.push(chunk));
      //this._source.stdout.pipe(this._stream);
    }
  }
}

module.exports = ReadableProcess;
