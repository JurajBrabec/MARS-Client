const debug = require("debug")("emitterFile");
const fs = require("fs");
const Emitter = require("./Emitter");

class EmitterFile extends Emitter {
  constructor(options) {
    delete options.run;
    options = {
      ...{
        encoding: "utf8",
        path: null,
      },
      ...options,
      ...{ objectMode: false },
    };
    super(options);
    return this;
  }
  _callback(error, data) {
    debug("callback", error, data);
    if (error) return this.error(error);
    this.data(data);
    this.end();
  }
  _run(...args) {
    debug("_run", args);
    const encoding = this.encoding;
    fs.readFile(this.path, { encoding }, this._callback.bind(this));
  }
}

module.exports = EmitterFile;
