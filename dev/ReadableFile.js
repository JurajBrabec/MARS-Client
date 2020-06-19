const debug = require("debug")("readableFile");
const fs = require("fs");
const Readable = require("./Readable");

class ReadableFile extends Readable {
  constructor(options) {
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
    debug("_read", size);
    //    return fs.createReadStream(this.path, this.options).pipe(this._stream);
    fs.createReadStream(this.path, this.options)
      //      .once("close", () => debug(">close"))
      //      .on("data", (chunk) => debug(">data", chunk))
      //      .once("error", (error) => debug(">error", error.message || error))
      //      .once("end", () => debug(">end"))
      //      .on("resume", () => debug(">resume"))
      .once("close", () => this.end())
      .on("data", (chunk) => this.push(chunk))
      .once("end", () => this.end())
      .once("error", (error) => this.error(error));
  }
}

module.exports = ReadableFile;
