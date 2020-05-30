const debug = require("debug");
const EventEmitter = require("events");
const { execFile } = require("child_process");
const fs = require("fs");

class Status {
  source = "";
  state = "pending";
}
class Emitter extends EventEmitter {
  constructor(options) {
    const started = new Date();
    super();
    this.status({ source: this.constructor.name });
    if (options.command) this._command = options.command.bind(this);
    delete options.command;
    const dbg = debug(this.constructor.name);
    const dbgEvent = debug(`${this.constructor.name}::event`);
    options = {
      ...options,
      ...{ dbg, dbgEvent, started },
    };
    Object.assign(this, options);
    this.debugEvents(dbgEvent);
    return this;
  }
  _command(success, failure, args) {
    success();
  }
  debugEvents(dbg) {
    this.on("execute", (args) => dbg(`executing '${args}'`))
      .on("data", (chunk) => this.onData(chunk))
      .on("progress", (progress) => dbg(`progress '${progress}'`))
      .once("success", (result) => dbg(`succeeded '${result}'`))
      .once("failure", (error) => dbg(`failed '${error}'`))
      .once("exit", (status) => dbg(`exiting ${status}`));
  }
  elapsed() {
    return new Date() - this.started;
  }
  end() {
    this.status({ duration: this.elapsed() });
    this.emit("exit", this.status());
  }
  execute(args) {
    this.emit("execute", args);
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      try {
        this.status({ args });
        this._command(this.success.bind(this), this.failure.bind(this), args);
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
    this.status({ state, error });
    process.nextTick(this.reject, error);
    this.end();
  }
  progress(value) {
    this.emit("progress", value);
  }
  success(result) {
    const state = "success";
    this.emit(state, result);
    this.status({ state, result });
    process.nextTick(this.resolve, result);
    this.end();
  }
  status(options) {
    if (!this.status) this._status = new Status();
    if (!options) return this._status;
    this._status = { ...this._status, ...options };
    for (let key in this._status) {
      if (this._status[key] === null) {
        delete this._status[key];
      }
    }
    return this;
  }
  onData(chunk) {
    this.dbgEvent(`data '${chunk}'`);
    let { bytes, lines, objects } = this.status();
    if (typeof chunk === "object") {
      objects++;
      this.status({ objects });
    } else if (chunk) {
      bytes += chunk.length;
      lines += chunk.split("\n").length;
      this.status({ bytes, lines });
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
    this.status({ file: this.path, bytes: 0, lines: 0 });
    return this;
  }
  callback(error, result) {
    if (error) return this.failure(error);
    this.onData(result);
    this.success(result);
    this.status({ result: null });
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
    this.status({ code });
    super.callback(error, result);
  }
  _command() {
    const args = this.args;
    const file = this.file;
    this.status({ args, file });
    this.process = execFile(file, args, this.options, this.callback.bind(this));
    const dbg = this.dbgEvent;
    this.process
      .once("close", (code) => dbg(`process::closing '${code}'`))
      .once("disconnect", () => dbg("process::disconnecting"))
      .once("error", (error) => dbg(`process::error '${error}'`))
      .once("exit", (code) => dbg(`process::exiting '${code}'`))
      .on("message", (message) => dbg(`process::message '${message}'`));
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
  _command(success, failure, args) {
    this.database.pool
      .query(this.sql, args)
      .then((rows) => success(rows))
      .catch((error) => failure(error));
  }
  debugEvents(dbg) {
    super.debugEvents(dbg);
    this.database.pool
      .on("acquire", (conn) => dbg(`db::acquired ${conn.threadId}`))
      .on("connection", (conn) => dbg(`db::connected ${conn.threadId}`))
      .on("enqueue", () => dbg("db::enqueued"))
      .on("error", (error) => dbg(`db::error '${error}'`))
      .on("release", (conn) => dbg(`db::released '${conn}'`));
  }
  success(result) {
    super.success(result);
    const rows = result.length;
    this.status({ rows, result: null });
  }
}

module.exports = {
  Emitter,
  File,
  Process,
  Sql,
};
