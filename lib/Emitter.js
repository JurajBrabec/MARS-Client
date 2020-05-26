const debug = require("debug");
const EventEmitter = require("events");
const { execFile } = require("child_process");
const fs = require("fs");
const moment = require("moment");

class Status {
  source = "";
  state = "pending";
}
class Command extends EventEmitter {
  constructor(options) {
    super(options);
    this.dbg = debug(this.constructor.name);
    this.dbgEvent = debug(`${this.constructor.name}::event`);
    this.resolve = null;
    this.reject = null;
    this.started = moment();
    this.status = new Status();
    this.status.source = this.constructor.name;
    return this;
  }
  command(success, failure, args) {
    //    success(args);
    success();
  }
  debug(name) {
    if (name) {
      this.dbg = debug(name);
      this.dbgEvent = debug(`${name}::event`);
    }
    this.dbg.enabled = true;
    return this;
  }
  debugEvents(name) {
    this.debug(name);
    this.dbgEvent.enabled = true;
    const d = this.dbgEvent;
    this.on("execute", (args) => d(`executing '${args}'`))
      .on("data", (chunk) => d(`data '${chunk}'`))
      .on("progress", (progress) => d(`progress '${progress}'`))
      .on("success", (result) => d(`succeeded '${result}'`))
      .on("failure", (error) => d(`failed '${error}'`))
      .on("exit", (status) => d(`exiting ${status}`));
    return this;
  }
  elapsed() {
    return moment().diff(this.started);
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
        this.command(this.success.bind(this), this.failure.bind(this), args);
      } catch (error) {
        this.failure(error);
      }
    });
  }
  failure(error) {
    //    if (this.status.state !== "pending") return;
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
    //    if (this.status.state !== "pending") return;
    this.emit("success", result);
    this.status.state = "success";
    if (result) this.status.result = result;
    process.nextTick(this.resolve, result);
    this.end();
  }
}
class Function extends Command {
  constructor(options, command) {
    super(options);
    this.command = command;
    return this;
  }
}
class File extends Command {
  constructor(options) {
    super(options);
    this.encoding = options.encoding;
    this.fileName = options.fileName;
    this.options = { encoding: options.encoding };
    this.status.file = this.fileName;
    return this;
  }
  callback(error, result) {
    if (error) return this.failure(error);
    this.success(result);
    delete this.status.result;
    this.status.bytes = result.length;
    this.status.lines = result.split("\n").length;
  }
  command() {
    fs.readFile(this.fileName, this.options, this.callback.bind(this));
  }
}
class Process extends File {
  constructor(options) {
    super(options);
    this.args = options.args;
    this.fileName = options.command;
    this.options.maxBuffer = 256 * 1024 * 1024;
    delete this.status.file;
    return this;
  }
  callback(error, result) {
    this.status.code = this.process.signalCode || this.process.exitCode;
    super.callback(error, result);
  }
  command() {
    this.status.args = this.args;
    this.status.command = this.fileName;
    this.process = execFile(
      this.fileName,
      this.args,
      this.options,
      this.callback.bind(this)
    );
    const d = this.dbgEvent;
    this.process
      .on("close", (code) => d(`process::closing '${code}'`))
      .on("disconnect", () => d("process::disconnecting"))
      .on("error", (error) => d(`process::error '${error}'`))
      .on("exit", (code) => d(`process::exiting '${code}'`))
      .on("message", (message) => d(`process::message '${message}'`));
  }
}
class Sql extends Command {
  constructor(options) {
    super(options);
    this.database = options.database;
    this.sql = options.sql;
    return this;
  }
  debugEvents(name) {
    super.debugEvents(name);
    const d = this.dbgEvent;
    this.database.pool
      .on("acquire", (conn) => d(`db::acquired ${conn.threadId}`))
      .on("connection", (conn) => d(`db::connected ${conn.threadId}`))
      .on("enqueue", () => d("db::enqueued"))
      .on("error", (error) => d(`db::error '${error}'`))
      .on("release", (conn) => d(`db::released '${conn}'`));
    return this;
  }
  command(success, failure, args) {
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
  Command,
  Function,
  File,
  Process,
  Sql,
};
