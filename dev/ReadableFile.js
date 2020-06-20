const debug = require("debug")("ReadableFile");
const fs = require("fs");
const Readable = require("./Readable");

class ReadableFile extends Readable {
  constructor(options) {
    if (options.debug) debug.enabled = true;
    delete options.destroy;
    delete options.read;
    options = {
      ...{
        encoding: "utf8",
        highWaterMark: 64 * 1024,
        path: null,
      },
      ...options,
      ...{ objectMode: false },
    };
    super(options);
    return this;
  }
  _read(size) {
    if (this._source) return;
    debug("_read", size);
    const options = {
      encoding: this.encoding,
      highWaterMark: this.highWaterMark,
    };
    this._source = fs
      .createReadStream(this.path, options)
      .once("close", () => debug(">close"))
      .on("data", (chunk) => debug(">data", chunk))
      .once("error", (error) => debug(">error", error.message || error))
      .once("end", () => debug(">end"))
      .on("resume", () => debug(">resume"))
      .once("close", () => this.end())
      .on("data", (chunk) => this.push(chunk))
      .once("end", () => this.end())
      .once("error", (error) => this.error(error));
  }
}

module.exports = ReadableFile;
