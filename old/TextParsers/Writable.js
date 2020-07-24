const debug = require("debug");
const fs = require("fs");
const stream = require("stream");
const { Status } = require("./Status");

class Writable extends stream.Writable {
  constructor(options) {
    const write = options.write;
    delete options.write;
    super(options);
    const source = this.constructor.name;
    const dbg = debug(source);
    const status = new Status({ source });
    if (write) this.writeCb = write.bind(this);
    if (options.objectMode) {
      status.set({ objects: 0 });
    } else {
      status.set({ bytes: 0, lines: 0 });
    }
    options = { ...options, ...{ dbg, status } };
    Object.assign(this, options);
    this.debugEvents();
    return this.once("finish", () => this.success()).once("error", (error) =>
      this.failure(error)
    );
  }
  debugEvents() {
    const dbg = debug(`${this.constructor.name}::event`);
    this.on("drain", () => dbg("draining"))
      .on("pipe", (pipe) => dbg("piping", pipe.constructor.name))
      .on("unpipe", (pipe) => dbg("unpiping", pipe.constructor.name));
    this.dbgEvents = dbg;
    return dbg;
  }
  failure(error) {
    this.dbgEvents("error", error);
    let state = "failure";
    if (typeof error === "object") {
      error = {
        code: error.code || error.constructor.name,
        message: error.message,
      };
    }
    this.status.set({ state, error });
    this.emit("failure", error);
  }
  success() {
    this.dbgEvents("finish");
    let state = "success";
    this.status.set({ state });
    this.emit("success", this.status.get());
  }
  _write(chunk, encoding, callback) {
    this.onData(chunk);
    return this.writeCb(chunk, encoding, callback);
  }
  onData(chunk) {
    this.dbgEvents("data");
    let { bytes, lines, objects } = this.status.get();
    if (typeof chunk === "object") {
      objects++;
      this.status.set({ objects });
    } else if (chunk) {
      bytes += chunk.length;
      lines += chunk.split("\n").length;
      this.status.set({ bytes, lines });
    }
    return this;
  }
  writeCb(chunk, encoding, callback) {
    return callback();
  }
}
class File extends Writable {
  constructor(options) {
    const stream = fs.createWriteStream(options.path);
    options = {
      ...{
        defaultEncoding: "utf8",
        objectMode: false,
        decodeStrings: false,
        path: null,
        stream,
      },
      ...options,
    };
    delete options.write;
    delete options.final;
    delete options.destroy;
    super(options);
    this.status.set({ file: this.path });
    return this;
  }
  debugEvents() {
    const dbg = super.debugEvents();
    this.stream
      .on("close", () => dbg("close"))
      .on("open", (fd) => dbg("open", fd))
      .on("ready", () => dbg("ready"));
    return dbg;
  }
  writeCb(chunk, encoding, callback) {
    if (chunk !== null) {
      this.onData(chunk);
      this.stream.write(chunk);
    }
    //    return callback();
    return setImmediate(callback);
  }
}
class Sql extends Writable {
  constructor(options) {
    options = {
      ...{
        defaultEncoding: "utf8",
        highWaterMark: 2048,
        objectMode: true,
        database: null,
        sql: null,
      },
      ...{ options },
    };
    delete options.write;
    delete options.final;
    delete options.destroy;
    super(options);
    this.status.set({ rows: 0, sqls: 0, warnings: 0 });
    return this;
  }
  debugEvents() {
    const dbg = super.debugEvents();
    this.database.pool
      .on("acquire", (conn) => dbg("acquired", conn.threadId))
      .on("connection", (conn) => dbg("connection", conn.threadId))
      .on("enqueue", () => dbg("enqueued"))
      .on("error", (error) => dbg("error", error))
      .on("release", (conn) => dbg("released", conn));
    return dbg;
  }
  async writeCb(chunk, encoding, callback) {
    if (chunk === null) return callback();
    this.onData(chunk);
    try {
      const started = new Date();
      const batch = await this.database.pool.batch(this.sql, chunk);
      const duration = new Date() - started;
      let { rows, sqls, warnings } = this.status.get();
      rows += batch.affectedRows;
      sqls++;
      warnings += batch.warningStatus;
      this.status.set({ duration, rows, sqls, warnings });
      //      return callback();
      return setImmediate(callback);
    } catch (error) {
      //      return callback(error);
      return setImmediate(callback, [error]);
    }
  }
}

module.exports = {
  Writable,
  File,
  Sql,
};

const simplestWritable = new stream.Writable({
  defaultEncoding: "utf8",
  objectMode: false,
  decodeStrings: false,
  write(chunk, encoding, callback) {
    console.log(chunk);
    callback();
  },
});
