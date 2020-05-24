const debug = require("debug");
const fs = require("fs");
const moment = require("moment");
const stream = require("stream");

const myWritable = new stream.Writable({
  defaultEncoding: "utf8",
  objectMode: false,
  decodeStrings: false,
  write(chunk, encoding, callback) {
    console.log(chunk);
    callback();
  },
});

class Status {
  source = "";
  state = "pending";
}

class Writable extends stream.Writable {
  constructor(options) {
    super(options);
    this.dbg = debug(this.constructor.name);
    this.dbgEvent = debug(`${this.constructor.name}::event`);
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
    //    console.log(encoding, chunk);
    return success();
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
    this.on("close", () => d(`closing`))
      .on("drain", () => d(`draining`))
      .on("error", (error) => d(`error '${error}'`))
      .on("pipe", () => d(`piping`))
      .on("unpipe", () => d(`unpiping`))
      .on("finish", () => d(`finishing`))
      .on("end", (status) => d(`ending ${status.state}`));
    this.on("error", (error) => {
      this.status.state = "failure";
      if (typeof error === "object") {
        this.status.error = {
          code: error.code || error.constructor.name,
          message: error.message,
        };
      } else {
        this.status.error = error;
      }
    }).on("finish", () => {
      if (this.status.state !== "pending") return;
      this.status.state = "success";
      this.emit("end", this.status);
    });
    return this;
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
    super(options);
    this.fileName = options.fileName;
    this.status.file = this.fileName;
    this.stream = fs.createWriteStream(this.fileName);
    return this;
  }
  command(chunk, encoding, success, failure) {
    if (chunk !== null) this.stream.write(chunk);
    return success();
  }
  debugEvents(name) {
    super.debugEvents(name);
    const dbg = this.dbgEvent;
    this.stream
      .on("close", () => dbg(`close`))
      .on("open", (fd) => dbg(`open ${fd}`))
      .on("ready", () => dbg(`ready`));
    return this;
  }
}
class Sql extends Writable {
  constructor(options) {
    super(options);
    this.batchSize = options.batchSize || 2048;
    this.database = options.database;
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
      const started = moment();
      const batch = await this.database.pool.batch(this.sql, this.buffer);
      this.status.duration = moment().diff(started);
      this.status.rows += batch.affectedRows;
      this.status.sqls++;
      this.status.warnings += batch.warningStatus;
      this.buffer = [];
      success();
    } catch (error) {
      failure(error);
    }
  }
  debugEvents(name) {
    super.debugEvents(name);
    const dbg = this.dbgEvent;
    this.database.pool
      .on("acquire", (conn) => dbg(`acquired ${conn.threadId}`))
      .on("connection", (conn) => dbg(`connection ${conn.threadId}`))
      .on("enqueue", () => dbg("enqueued"))
      .on("error", (error) => dbg(`error '${error}'`))
      .on("release", (conn) => dbg(`released '${conn}'`));
    return this;
  }
}

module.exports = {
  Writable,
  Function,
  File,
  Sql,
};
