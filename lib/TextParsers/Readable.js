const debug = require("debug");
const { execFile } = require("child_process");
const fs = require("fs");
const stream = require("stream");
const { Emitter } = require("./Emitter");

class Readable extends Emitter {
  constructor(options) {
    delete options.command;
    super(options);
    if (options.destroy) this._destroy = options.destroy.bind(this);
    if (options.read) this._read = options.read.bind(this);
    const dbg = debug(`${this.constructor.name}:stream`);
    this.stream = this.createStream(options, dbg);
    this.stream.dbg = dbg;
    if (options.objectMode) {
      this.status.set({ objects: 0 });
    } else {
      this.status.set({ bytes: 0, lines: 0 });
    }
    return this;
  }
  _read(args) {
    this.push(null);
  }
  _destroy(error, callback) {
    return callback(error);
  }
  createStream(options, dbg) {
    options.read = () => {};
    options.destroy = (error, callback) => {
      return callback(error);
    };
    return new stream.Readable(options)
      .once("close", () => dbg("closing"))
      .on("pause", () => dbg("pausing"))
      .on("resume", () => dbg("resuming"))
      .once("end", () => dbg("ending"))
      .on("data", (chunk) => dbg("data", chunk.length))
      .once("error", (error) => dbg("error", error));
  }
  data(chunk) {
    this.emit("data", chunk);
    return this;
  }
  destroy(error) {
    return this.stream.destroy(error);
  }
  execute(args) {
    this.emit("execute", args);
    this.status.set({ args });
    if (!this.status.get("pipe")) this.stream.once("end", () => this.success());
    this.stream
      .once("close", () => this.emit("close"))
      .on("data", (chunk) => this.data(chunk))
      .once("error", (error) => this.failure(error));
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      try {
        this._read(args);
      } catch (error) {
        this.failure(error);
      }
    });
  }
  pipe(destination, options) {
    this.status.set({ pipe: destination.status.get() });
    this.stream.off("end", () => this.success());
    destination
      .once("success", (status) => {
        this.status.set({ pipe: status });
        this.success();
      })
      .once("failure", (error) => this.failure(error));
    return this.stream.pipe(destination, options);
  }
  push(chunk, encoding) {
    return this.stream.push(chunk, encoding);
  }
}
class File extends Readable {
  constructor(options) {
    options = {
      ...{
        encoding: "utf8",
        objectMode: false,
        path: null,
      },
      ...options,
    };
    delete options.read;
    delete options.destroy;
    super(options);
    this.status.set({ file: this.path });
    return this;
  }
  _read() {}
  createStream(options, dbg) {
    return new fs.ReadStream(options.path)
      .setEncoding(options.encoding)
      .on("open", (fd) => dbg("open", fd))
      .on("ready", () => dbg("ready"));
  }
}
class Process extends Readable {
  constructor(options) {
    options = {
      ...{
        encoding: "utf8",
        objectMode: false,
        args: null,
        file: null,
        maxBuffer: 256 * 1024 * 1024,
      },
      ...options,
    };
    delete options.read;
    delete options.destroy;
    super(options);
    this.status.set({ file: this.file, args: this.args });
    return this;
  }
  _read() {
    const dbg = this.stream.dbg;
    const process = execFile(this.file, this.args, {
      encoding: this.encoding,
      maxBuffer: this.maxBuffer,
    });
    process
      .once("close", (code, signal) => dbg("closing", code))
      .once("disconnect", () => dbg("disconnecting"))
      .once("error", (error) => dbg("error", error))
      .once("exit", (code, signal) => dbg("exiting", code))
      .on("message", (message) => dbg("message", message))
      .once("close", (code, signal) => {
        code = signal || code;
        this.status.set({ code });
        if (code) return this.destroy(code);
        this.push(null);
        this.emit("close", code);
      })
      .once("error", (error) => this.destroy(error));
    process.stderr.pipe(process.stdout);
    process.stdout.on("data", (data) => this.push(data));
  }
  execute(args) {
    return super.execute(args || this.args);
  }
}
class Sql extends Readable {
  constructor(options) {
    options = {
      ...{
        encoding: "utf8",
        objectMode: true,
        database,
        sql,
      },
      ...options,
    };
    delete options.read;
    delete options.destroy;
    super(options);
    return this;
  }
  createStream(options, dbg) {
    options.database.pool
      .on("acquire", (conn) => dbg("acquired", conn.threadId))
      .on("connection", (conn) => dbg("connection", conn.threadId))
      .on("enqueue", () => dbg("enqueued"))
      .on("error", (error) => dbg("error", error))
      .on("release", (conn) => dbg("released", conn));
    return super.createStream(options, dbg);
  }
  async _read(args) {
    let connection;
    const dbg = this.stream.dbg;
    try {
      connection = await this.database.pool
        .getConnection()
        .on("error", (error) => dbg("error", error));
      const query = await connection
        .queryStream(this.sql, args)
        .on("fields", (fields) => dbg("fields", fields))
        .on("data", (row) => dbg("row", row))
        .once("end", () => dbg("ending"))
        .once("error", (error) => dbg("error", error))
        .on("data", (row) => this.push(row))
        .once("end", () => this.push(null))
        .once("error", (error) => this.destroy(error));
    } catch (error) {
      this.destroy(error);
    } finally {
      connection.release();
    }
  }
}

module.exports = {
  Readable,
  File,
  Process,
  Sql,
};

const simplestReadable = new stream.Readable({
  encoding: "utf8",
  objectMode: true,
  read() {
    this.push({ name: "John" });
    this.push(null);
  },
  destroy(error, callback) {
    callback(error);
  },
});
