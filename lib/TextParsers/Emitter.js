const debug = require("debug");
const EventEmitter = require("events");
const { execFile } = require("child_process");
const fs = require("fs");
const { Status } = require("./Status");

class Emitter extends EventEmitter {
  constructor(options) {
    super();
    const source = this.constructor.name;
    const dbg = debug(source);
    const status = new Status({ source });
    if (options.command) {
      this._command = options.command.bind(this);
      delete options.command;
    }
    options = {
      ...options,
      ...{ dbg, status },
    };
    Object.assign(this, options);
    this.debugEvents();
    return this.on("data", (chunk) => this.onData(chunk));
  }
  _command(emit, args) {
    emit.success();
  }
  debugEvents() {
    const dbg = debug(`${this.constructor.name}::event`);
    this.on("execute", (args) => dbg("executing", args))
      .on("progress", (progress) => dbg("progress", progress))
      .once("success", (result) => dbg("succeeded"))
      .once("failure", (error) => dbg("failed", error))
      .once("exit", (status) => dbg("exiting"));
    this.dbgEvents = dbg;
    return dbg;
  }
  end() {
    this.emit("exit", this.status.get());
  }
  execute(args) {
    this.emit("execute", args);
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      try {
        this.status.set({ args });
        this._command(
          {
            failure: this.failure.bind(this),
            progress: this.progress.bind(this),
            success: this.success.bind(this),
          },
          args
        );
      } catch (error) {
        this.failure(error);
      }
    });
  }
  failure(error) {
    const state = "failure";
    this.emit(state, error);
    if (typeof error === "object") {
      error = {
        code: error.code || error.constructor.name,
        message: error.message,
      };
    }
    this.status.set({ state, error });
    process.nextTick(this.reject, error);
    this.end();
  }
  progress(value) {
    this.emit("progress", value);
  }
  success(result) {
    const state = "success";
    this.emit(state, result);
    this.status.set({ state, result });
    process.nextTick(this.resolve, result);
    this.end();
  }
  onData(chunk) {
    this.dbgEvents("data", chunk.length);
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
}
class File extends Emitter {
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
    this.status.set({ file: this.path, bytes: 0, lines: 0 });
    return this;
  }
  callback(error, result) {
    if (error) return this.failure(error);
    this.onData(result);
    this.success(result);
    this.status.set({ result: null });
  }
  _command() {
    const encoding = this.encoding;
    fs.readFile(this.path, { encoding }, this.callback.bind(this));
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
  callback(error, result) {
    const code = this.process.signalCode || this.process.exitCode;
    this.status.set({ code });
    super.callback(error, result);
  }
  _command() {
    const args = this.args;
    const file = this.file;
    this.status.set({ args, file });
    this.process = execFile(file, args, this.options, this.callback.bind(this));
    const dbg = this.dbgEvents;
    this.process
      .once("close", (code) => dbg("process::closing", code))
      .once("disconnect", () => dbg("process::disconnecting"))
      .once("error", (error) => dbg("process::error", error))
      .once("exit", (code) => dbg("process::exiting", code))
      .on("message", (message) => dbg("process::message", message));
  }
}
class Sql extends Emitter {
  constructor(options) {
    delete options.command;
    options = {
      ...{ database: null, sql: null },
      ...options,
    };
    super(options);
    return this;
  }
  _command(emit, args) {
    this.database.pool
      .query(this.sql, args)
      .then((rows) => emit.success(rows))
      .catch((error) => emit.failure(error));
  }
  debugEvents() {
    const dbg = super.debugEvents();
    this.database.pool
      .on("acquire", (conn) => dbg("db::acquired", conn.threadId))
      .on("connection", (conn) => dbg("db::connected", conn.threadId))
      .on("enqueue", () => dbg("db::enqueued"))
      .on("error", (error) => dbg("db::error", error))
      .on("release", (conn) => dbg("db::released", conn));
    return dbg;
  }
  success(result) {
    super.success(result);
    const rows = result.length;
    this.status.set({ rows, result: null });
  }
}

module.exports = {
  Emitter,
  File,
  Process,
  Sql,
};
