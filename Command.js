const debug = require("debug")("commmand");
const EventEmitter = require("events");
const { PassThrough } = require("stream");

class Command {
  constructor(options) {
    const isStreaming = options.read !== undefined;
    debug("constructor", options);
    options = {
      ...{ destroy: this._destroy, read: this._read, run: this._run },
      ...options,
      ...{ isStreaming, result: "" },
    };
    this._destroy = options.destroy;
    this._read = options.read;
    this._run = options.run;
    delete options.destroy;
    delete options.read;
    delete options.run;
    Object.assign(this, options);
    this._emitter = new EventEmitter();
    this._stream = new PassThrough({
      ...options,
      ...{ destroy: this._destroy.bind(this), read: this._read.bind(this) },
    });
    return this;
  }
  _destroy(error, callback) {
    debug("destroy", error);
    if (callback) callback(error);
  }
  _read(size) {
    debug("_read", size);
    this.push("test");
    if (1) throw new Error("TEST");
    this.push(null);
  }
  _run(...args) {
    debug("_commmand", args);
    this.data("test");
    if (1) throw new Error("TEST");
    this.end();
  }
  data(...data) {
    data = data.join("");
    debug("data", data);
    this.emit("data", data);
    if (!this.isStreaming) this.result += data;
  }
  end() {
    if (this.status !== undefined) return this;
    this.status = 0;
    debug("end", this.status);
    this.progress(100);
    this.emit("end", this.status);
    if (this.resolve)
      process.nextTick(
        this.resolve,
        this.isStreaming ? this.status : this.result
      );
    return this;
  }
  emit(event, ...args) {
    debug("emit", event, event === "error" ? args[0].message || args[0] : args);
    this._emitter.emit(event, ...args);
  }
  error(error) {
    if (this.status !== undefined) return this;
    this.status = 1;
    debug("error", error.message || error);
    this.emit("error", error);
    if (this.reject) process.nextTick(this.reject, error);
    return this;
  }
  on(event, listener) {
    debug("on", event, listener);
    this._emitter.on(event, listener);
    return this;
  }
  once(event, listener) {
    debug("once", event, listener);
    this._emitter.once(event, listener);
    return this;
  }
  pipe(destination, options) {
    if (!this.isStreaming) throw new Error("Command not streaming.");
    debug("pipe", destination.constructor, options);
    destination
      .once("end", (status) => this.end(status))
      .once("error", (error) => this.error(error.message || error));
    return this._stream.pipe(destination, options);
  }
  progress(value, count) {
    debug("progress", value, count);
    if (count) value = Number(((100 * value) / count).toFixed(1));
    this.emit("progress", value);
  }
  push(chunk, encoding) {
    if (!this.isStreaming) throw new Error("Command not streaming.");
    debug("push", chunk, encoding);
    this._stream.push(chunk, encoding);
  }
  run(...args) {
    debug("run", args);
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      try {
        this.progress(0);
        if (this.isStreaming) {
          this._stream
            .once("close", () => debug(">close"))
            .on("data", (chunk) => debug(">data", chunk))
            .once("error", (error) => debug(">error", error.message || error))
            .once("end", () => debug(">end"))
            .on("resume", () => debug(">resume"))
            .once("close", () => this.end())
            .on("data", (chunk) => this.data(chunk))
            .once("error", (error) => this.error(error))
            .once("end", () => this.end());
        } else {
          this._run(...args);
          this.end();
        }
      } catch (error) {
        this.error(error);
      }
    });
  }
}

module.exports = Command;

debug.enabled = true;
const command = new Readable({
  args: ["-summary", "-l"],
  file: "D:/Veritas/NetBackup/bin/admincmd/bpdbjobs.exe",
  path: ".env",
  run(args) {
    this.progress(1, 9);
    this.data("Emitter run ", args);
    this.end();
  },
  encoding: "utf8",
  read(size) {
    this.push("Readable stream");
    this.progress(1, 9);
    this.push(null);
  },
});
command
  .on("data", (data) => console.log(">Data:", data))
  .once("error", (error) => console.log(">Error:", error.message || error))
  .once("end", (status) => console.log(">End", status))
  .on("progress", (progress) => console.log(">Progress:", progress));
command.pipe(process.stdout);
command
  .run("args")
  .then((result) => console.log("Result:", result))
  .catch((error) => console.log("Error:", error));
