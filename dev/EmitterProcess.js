const debug = require("debug")("emitterProcess");
const { execFile } = require("child_process");
const EmitterFile = require("./EmitterFile");

class EmitterProcess extends EmitterFile {
  constructor(options) {
    if (options.debug) debug.enabled = true;
    options = {
      ...{ args: null, file: null, maxBuffer: 256 * 1024 * 1024 },
      ...options,
    };
    super(options);
    return this;
  }
  _run(...args) {
    debug("_run", args);
    execFile(this.file, this.args, this.options, this._callback.bind(this))
      .once("close", (code, signal) => debug("close", signal || code))
      .once("error", (error) => debug("error", error))
      .once("exit", (code, signal) => debug("exit", signal || code));
  }
}

module.exports = EmitterProcess;
