const debug = require("debug")("readableProcess");
const { execFile } = require("child_process");
const ReadableFile = require("./ReadableFile");

class ReadableProcess extends ReadableFile {
  constructor(options) {
    options = {
      ...{ args: null, file: null, maxBuffer: 256 * 1024 * 1024 },
      ...options,
    };
    super(options);
    return this;
  }
  _read(size) {
    debug("_read", size);
    const proc = execFile(this.file, this.args, this.options)
      .once("close", (code, signal) => debug("close", signal || code))
      .once("disconnect", () => debug("disconnect"))
      .once("error", (error) => debug("error", error))
      .once("exit", (code, signal) => debug("exit", signal || code))
      .on("message", (message) => debug("message", message))
      .once("close", () => this.end())
      .once("error", (error) => this.error(error));
    proc.stdout.pipe(this._stream);
    proc.stdout
      //      .once("close", () => this.end())
      .on("data", (chunk) => this.push("!" + chunk));
    //      .once("end", () => this.end());
    //      .once("error", (error) => this.error(error));
  }
}

module.exports = ReadableProcess;
