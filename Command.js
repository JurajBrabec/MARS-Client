const debug = require("debug")("commmand");
const EventEmitter = require("events");
const { execFile } = require("child_process");
const fs = require("fs");
const { PassThrough } = require("stream");

class Command {
  constructor(options) {
    const isStreaming = options.read !== undefined;
    debug("constructor", options);
    options = {
      ...{ command: this._command, destroy: this._destroy, read: this._read },
      ...options,
      ...{ isStreaming, result: "" },
    };
    this._command = options.command;
    this._read = options.read;
    this._destroy = options.destroy;
    delete options.command;
    delete options.read;
    delete options.destroy;
    Object.assign(this, options);
    this._emitter = new EventEmitter();
    this._stream = new PassThrough({
      ...options,
      ...{ destroy: this._destroy.bind(this), read: this._read.bind(this) },
    });
    return this;
  }
  _command(...args) {
    debug("_commmand", args);
    this.data("test");
    if (1) throw new Error("TEST");
    this.end();
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
  execute(...args) {
    return new Promise((resolve, reject) => {
      if (this.isStreaming) return reject(new Error("Command streaming."));
      debug("execute", args);
      this.resolve = resolve;
      this.reject = reject;
      try {
        this.progress(0);
        this._command(...args);
        this.end();
      } catch (error) {
        this.error(error);
      }
    });
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
    return this.isStreaming ? this.stream() : this.execute(...args);
  }
  stream() {
    return new Promise((resolve, reject) => {
      if (!this.isStreaming) return reject(new Error("Command not streaming."));
      debug("stream");
      this.resolve = resolve;
      this.reject = reject;
      try {
        this.progress(0);
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
      } catch (error) {
        this.error(error);
      }
    });
  }
}

class File extends Command {
  constructor(options) {
    delete options.command;
    options = {
      ...{
        encoding: "utf8",
        objectMode: false,
        path: null,
      },
      ...options,
    };
    super(options);
    return this;
  }
  _callback(error, data) {
    if (error) return this._error(error);
    this.result = data;
    this._end();
  }
  _command() {
    const encoding = this.encoding;
    fs.readFile(this.path, { encoding }, this._callback.bind(this));
  }
}

class Process extends File {
  constructor(options) {
    options = {
      ...{ args: null, file: null, maxBuffer: 256 * 1024 * 1024 },
      ...options,
    };
    super(options);
    return this;
  }
  _command() {
    this.process = execFile(
      this.file,
      this.args,
      this.options,
      this._callback.bind(this)
    );
  }
}
class Sql extends File {
  constructor(options) {
    options = {
      ...{ database: null, sql: null },
      ...options,
    };
    super(options);
    return this;
  }
  _command(args) {
    this.database.pool
      .query(this.sql, args)
      .then((rows) => this._callback(null, rows))
      .catch((error) => this._callback(error));
  }
}

module.exports = {
  Command,
  File,
  Process,
  Sql,
};

debug.enabled = true;
const command = new Command({
  command(data) {
    this.progress(1, 9);
    this.data("executed with ", data);
    this.end();
  },
  encoding: "utf8",
  read(size) {
    this.push("Lorem Ipsum");
    this.push(null);
  },
})
  .on("data", (data) => console.log(">Data:", data))
  .once("error", (error) => console.log(">Error:", error.message || error))
  .once("end", (status) => console.log(">End", status))
  .on("progress", (progress) => console.log(">Progress:", progress));
command.pipe(process.stdout);
command
  .run()
  .then((result) => console.log("Result:", result))
  .catch((error) => console.log("Error:", error));
