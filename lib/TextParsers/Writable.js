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
    const dbg = debug(this.constructor.name);
    const dbgEvent = debug(`${this.constructor.name}::event`);
    this.debugEvents(dbgEvent);
    if (write) this._write = write.bind(this);
    if (final) this._final = final.bind(this);
    if (options.objectMode) {
      this.status({ objects: 0 });
    } else {
      this.status({ bytes: 0, lines: 0 });
    }
    options = { ...options, ...{ dbg, dbgEvent } };
    Object.assign(this, options);
    return this;
  }
  debugEvents(dbg) {
    this.once("close", () => dbg(`closing`))
      .on("drain", () => dbg(`draining`))
      .once("error", (error) => dbg(`error '${error}'`))
      .on("pipe", () => dbg(`piping`))
      .on("unpipe", () => dbg(`unpiping`))
      .once("finish", () => dbg(`finishing`))
      .once("end", (status) => dbg(`ending ${status.state}`));
    this.once("error", (error) => {
      state = "failure";
      if (typeof error === "object") {
        error = {
          code: error.code || error.constructor.name,
          message: error.message,
        };
      }
      this.status({ state, error });
    }).once("finish", () => {
      let state = this.status().state;
      if (state !== "pending") return;
      state = "success";
      this.status({ state });
      this.emit("end", this.status());
    });
  }
  _write(chunk, encoding, callback) {
    this.onData(chunk);
    callback();
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
    super(options);
    this.status({ file: this.path });
    return this;
  }
  debugEvents(dbg) {
    super.debugEvents(dbg);
    this.stream
      .on("close", () => dbg(`close`))
      .on("open", (fd) => dbg(`open ${fd}`))
      .on("ready", () => dbg(`ready`));
  }
  _write(chunk, encoding, callback) {
    if (chunk !== null) {
      this.onData(chunk);
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
        database: null,
        sql: null,
      },
      ...{ options },
    };
    delete options.write;
    delete options.final;
    super(options);
    this.status({ rows: 0, sqls: 0, warnings: 0 });
    return this;
  }
  debugEvents(dbg) {
    super.debugEvents(dbg);
    this.database.pool
      .on("acquire", (conn) => dbg(`acquired ${conn.threadId}`))
      .on("connection", (conn) => dbg(`connection ${conn.threadId}`))
      .on("enqueue", () => dbg("enqueued"))
      .on("error", (error) => dbg(`error '${error}'`))
      .on("release", (conn) => dbg(`released '${conn}'`));
  }
  async _write(chunk, encoding, callback) {
    if (chunk === null) return callback();
    this.onData(chunk);
    try {
      const started = new Date();
      const batch = await this.database.pool.batch(this.sql, chunk);
      const duration = new Date() - started;
      let { rows, sqls, warnings } = this.status();
      rows += batch.affectedRows;
      sqls++;
      warnings += batch.warningStatus;
      this.status({ duration, rows, sqls, warnings });
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
