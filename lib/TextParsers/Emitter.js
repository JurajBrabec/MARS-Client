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
    const command = options.command;
    delete options.command;
    super(options);
    if (command) this._command = command.bind(this);
    this.dbg = debug(this.constructor.name);
    const dbg = debug(`${this.constructor.name}::event`);
    this.on("execute", (args) => dbg(`executing '${args}'`))
      .on("data", (chunk) => dbg(`data '${chunk}'`))
      .on("progress", (progress) => dbg(`progress '${progress}'`))
      .once("success", (result) => dbg(`succeeded '${result}'`))
      .once("failure", (error) => dbg(`failed '${error}'`))
      .once("exit", (status) => dbg(`exiting ${status}`));
    this.dbgEvent = dbg;
    this.resolve = null;
    this.reject = null;
    this.started = new Date();
    this.status = new Status();
    this.status.source = this.constructor.name;
    return this;
  }
  _command(success, failure, args) {
    success();
  }
  elapsed() {
    return new Date() - this.started;
  }
  end() {
    this.status.duration = this.elapsed();
    this.emit("exit", this.status);
  }
  execute(args) {
    this.emit("execute", args);
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      try {
        this.status.args = args;
        this._command(this.success.bind(this), this.failure.bind(this), args);
      } catch (error) {
        this.failure(error);
      }
    });
  }
  failure(error) {
    this.emit("failure", error);
    this.status.state = "failure";
    if (typeof error === "object") {
      this.status.error = {
        code: error.code || error.constructor.name,
        message: error.message,
      };
    } else {
      this.status.error = error;
    }
    process.nextTick(this.reject, error);
    this.end();
  }
  progress(value) {
    this.emit("progress", value);
  }
  success(result) {
    this.emit("success", result);
    this.status.state = "success";
    if (result) this.status.result = result;
    process.nextTick(this.resolve, result);
    this.end();
  }
}
class File extends Emitter {
  constructor(options) {
    options = {
      ...{
        encoding: "utf8",
        objectMode: false,
      },
      ...options,
    };
    delete options.command;
    super(options);
    this.encoding = options.encoding;
    this.path = options.path;
    this.options = { encoding: options.encoding };
    this.status.file = this.path;
    return this;
  }
  callback(error, result) {
    if (error) return this.failure(error);
    this.success(result);
    delete this.status.result;
    this.status.bytes = result.length;
    this.status.lines = result.split("\n").length;
  }
  _command() {
    fs.readFile(this.path, this.options, this.callback.bind(this));
  }
}
class Process extends File {
  constructor(options) {
    super(options);
    this.args = options.args;
    this.file = options.file;
    this.options.maxBuffer = 256 * 1024 * 1024;
    delete this.status.file;
    return this;
  }
  callback(error, result) {
    this.status.code = this.process.signalCode || this.process.exitCode;
    super.callback(error, result);
  }
  _command() {
    this.status.args = this.args;
    this.status.file = this.file;
    this.process = execFile(
      this.file,
      this.args,
      this.options,
      this.callback.bind(this)
    );
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
    options = {
      ...{
        database: null,
        encoding: "utf8",
        objectMode: true,
        sql: "",
      },
      ...options,
    };
    delete options.command;
    super(options);
    const dbg = this.dbgEvent;
    this.database.pool
      .on("acquire", (conn) => dbg(`db::acquired ${conn.threadId}`))
      .on("connection", (conn) => dbg(`db::connected ${conn.threadId}`))
      .on("enqueue", () => dbg("db::enqueued"))
      .on("error", (error) => dbg(`db::error '${error}'`))
      .on("release", (conn) => dbg(`db::released '${conn}'`));
    this.database = options.database;
    this.sql = options.sql;
    return this;
  }
  _command(success, failure, args) {
    this.database.pool
      .query(this.sql, args)
      .then((rows) => success(rows))
      .catch((error) => failure(error));
  }
  success(result) {
    super.success(result);
    this.status.rows = result.length;
    delete this.status.result;
  }
}

module.exports = {
  Emitter,
  File,
  Process,
  Sql,
};
