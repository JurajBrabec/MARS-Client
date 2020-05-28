const debug = require("debug");
const fs = require("fs");
const stream = require("stream");

class Status {
  source = "";
  state = "pending";
}

class Writable extends stream.Writable {
  constructor(options) {
    super(options);
    this.dbg = debug(this.constructor.name);
    const d = debug(`${this.constructor.name}::event`);
    this.once("close", () => d(`closing`))
      .on("drain", () => d(`draining`))
      .once("error", (error) => d(`error '${error}'`))
      .on("pipe", () => d(`piping`))
      .on("unpipe", () => d(`unpiping`))
      .once("finish", () => d(`finishing`))
      .once("end", (status) => d(`ending ${status.state}`));
    this.once("error", (error) => {
      this.status.state = "failure";
      if (typeof error === "object") {
        this.status.error = {
          code: error.code || error.constructor.name,
          message: error.message,
        };
      } else {
        this.status.error = error;
      }
    }).once("finish", () => {
      if (this.status.state !== "pending") return;
      this.status.state = "success";
      this.emit("end", this.status);
    });
    this.dbgEvent = d;
    this.status = new Status();
    this.status.source = this.constructor.name;
    if (options.objectMode) {
      this.status.objects = 0;
    } else {
      this.status.bytes = 0;
      this.status.lines = 0;
    }
    return this;
  }
  command(chunk, encoding, success, failure) {
    return success();
  }
  _final(callback) {
    this.command(null, null, callback, callback);
  }
  _write(chunk, encoding, callback) {
    if (typeof chunk === "object") {
      this.status.objects++;
    } else {
      this.status.bytes += chunk.length;
      this.status.lines += chunk.split("\n").length;
    }
    this.command(chunk, encoding, callback, callback);
  }
}
class Function extends Writable {
  constructor(options, command) {
    super(options);
    this.command = command;
    return this;
  }
}
class File extends Writable {
  constructor(options) {
    options = {
      ...{
        defaultEncoding: "utf8",
        objectMode: false,
        decodeStrings: false,
      },
      ...options,
    };
    super(options);
    this.fileName = options.fileName;
    this.status.file = this.fileName;
    this.stream = fs.createWriteStream(this.fileName);
    const dbg = this.dbgEvent;
    this.stream
      .on("close", () => dbg(`close`))
      .on("open", (fd) => dbg(`open ${fd}`))
      .on("ready", () => dbg(`ready`));
    return this;
  }
  command(chunk, encoding, success, failure) {
    if (chunk !== null) this.stream.write(chunk);
    return success();
  }
}
class Sql extends Writable {
  constructor(options) {
    options = {
      ...{
        defaultEncoding: "utf8",
        objectMode: true,
      },
      ...{ options },
    };
    super(options);
    this.batchSize = options.batchSize || 2048;
    this.database = options.database;
    const dbg = this.dbgEvent;
    this.database.pool
      .on("acquire", (conn) => dbg(`acquired ${conn.threadId}`))
      .on("connection", (conn) => dbg(`connection ${conn.threadId}`))
      .on("enqueue", () => dbg("enqueued"))
      .on("error", (error) => dbg(`error '${error}'`))
      .on("release", (conn) => dbg(`released '${conn}'`));
    this.status.rows = 0;
    this.status.sqls = 0;
    this.status.warnings = 0;
    this.sql = options.sql;
    this.buffer = [];
    return this;
  }
  async command(chunk, encoding, success, failure) {
    if (chunk !== null) {
      this.buffer.push(chunk);
      if (this.buffer.length < this.batchSize) return success();
    }
    try {
      const started = new Date();
      const batch = await this.database.pool.batch(this.sql, this.buffer);
      this.status.duration = new Date() - started;
      this.status.rows += batch.affectedRows;
      this.status.sqls++;
      this.status.warnings += batch.warningStatus;
      this.buffer = [];
      success();
    } catch (error) {
      failure(error);
    }
  }
}

module.exports = {
  Writable,
  Function,
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
