const debug = require('debug')('Emitter');
const EventEmitter = require('events');

class Emitter {
  constructor(options = {}) {
    if (options.debug) debug.enabled = true;
    debug('constructor', options);
    options = {
      ...{ run: this._run },
      ...options,
      ...{ result: '' },
    };
    this._run = options.run;
    delete options.run;
    Object.assign(this, options);
    this._emitter = new EventEmitter();
    return this;
  }
  _run(...args) {
    debug('_run', args);
    this.data('test'); //this.error("test");
    this.end();
  }
  data(...data) {
    data = data.join('');
    debug('data', data);
    this.emit('data', data);
    this.result += data;
  }
  debug(enabled) {
    debug.enabled = enabled;
    return this;
  }
  end() {
    if (this.status !== undefined) return this;
    this.status = 0;
    debug('end', this.status);
    this.progress(100);
    this.emit('end', this.status);
    if (this.resolve) process.nextTick(this.resolve, this.result);
    return this;
  }
  emit(event, ...args) {
    debug('emit', event, args);
    if (this._emitter.eventNames().includes(event))
      this._emitter.emit(event, ...args);
    return this;
  }
  error(error) {
    if (this.status !== undefined) return this;
    error = error.message || error;
    this.status = error.code || 1;
    debug('error', error);
    this.emit('error', error);
    if (this.reject) process.nextTick(this.reject, error);
    return this;
  }
  on(event, listener) {
    debug('on', event, listener);
    this._emitter.on(event, listener);
    return this;
  }
  once(event, listener) {
    debug('once', event, listener);
    this._emitter.once(event, listener);
    return this;
  }
  progress(value, count) {
    debug('progress', value, count);
    if (count) value = Number(((100 * value) / count).toFixed(1));
    this.emit('progress', value);
  }
  run(...args) {
    debug('run', args);
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      try {
        this.progress(0);
        this._run(...args);
      } catch (error) {
        this.error(error);
      }
    });
  }
}

module.exports = Emitter;
