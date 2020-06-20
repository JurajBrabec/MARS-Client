const debug = require("debug")("ReadableProcess");
const { execFile } = require("child_process");
const ReadableFile = require("./ReadableFile");

class ReadableProcess extends ReadableFile {
  constructor(options) {
    if (options.debug) debug.enabled = true;
    options = {
      ...{ args: null, file: null, maxBuffer: 256 * 1024 * 1024 },
      ...options,
    };
    super(options);
    return this;
  }
  _read(size) {
    if (this._source) return;
    debug("_read", size);
    const options = {
      encoding: this.encoding,
      maxBuffer: this.maxBuffer,
    };
    this._source = execFile(this.file, this.args, options)
      .once("close", (code, signal) => debug("close", signal || code))
      .once("disconnect", () => debug("disconnect"))
      .once("error", (error) => debug("error", error))
      .once("exit", (code, signal) => debug("exit", signal || code))
      .on("message", (message) => debug("message", message))
      .once("close", () => this.end())
      .once("error", (error) => this.error(error));
    this._source.stderr.pipe(this._source.stdout);
    this._source.stdout.on("data", (chunk) => this.push(chunk));
    this._source.stdout.pipe(this._stream);
  }
}

module.exports = ReadableProcess;
