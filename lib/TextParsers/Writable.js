const debug = require("debug");
const fs = require("fs");
const stream = require("stream");

class Status {
  source = "";
  state = "pending";
}

class Writable extends stream.Writable {
  constructor(options) {
    const write = options.write;
    const final = options.final;
    delete options.write;
    delete options.final;
    super(options);
    this.dbg = debug(this.constructor.name);
    const dbg = debug(`${this.constructor.name}::event`);
    this.once("close", () => dbg(`closing`))
      .on("drain", () => dbg(`draining`))
      .once("error", (error) => dbg(`error '${error}'`))
      .on("pipe", () => dbg(`piping`))
      .on("unpipe", () => dbg(`unpiping`))
      .once("finish", () => dbg(`finishing`))
      .once("end", (status) => dbg(`ending ${status.state}`));
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
    this.dbgEvent = dbg;
    if (write) this._write = write.bind(this);
    if (final) this._final = final.bind(this);
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
  _write(chunk, encoding, callback) {
    this.updateStatus(chunk);
    callback();
  }
  updateStatus(chunk) {
    if (typeof chunk === "object") {
      this.status.objects++;
    } else if (chunk) {
      this.status.bytes += chunk.length;
      this.status.lines += chunk.split("\n").length;
    }
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
    delete options.write;
    delete options.final;
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
  _write(chunk, encoding, callback) {
    if (chunk !== null) {
      this.updateStatus(chunk);
      this.stream.write(chunk);
    }
    callback();
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
    delete options.write;
    delete options.final;
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
  _write(chunk, encoding, callback) {
    if (chunk !== null) {
      this.updateStatus(chunk);
      this.buffer.push(chunk);
      if (this.buffer.length < this.batchSize) return callback();
    }
    const rows = this.buffer;
    this.buffer = [];
    this.executeSql(this.sql, rows, callback);
  }
  async executeSql(sql, rows, callback) {
    try {
      const started = new Date();
      const batch = await this.database.pool.batch(sql, rows);
      this.status.duration = new Date() - started;
      this.status.rows += batch.affectedRows;
      this.status.sqls++;
      this.status.warnings += batch.warningStatus;
      callback();
    } catch (error) {
      callback(error);
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
