const debug = require("debug");
const { execFile } = require("child_process");
const fs = require("fs");
const stream = require("stream");
const { Command } = require("./Emitter");

class Readable extends Command {
  constructor(options) {
    super(options);
    const dbg = debug(`${this.dbg.namespace}:stream`);
    if (options.objectMode) {
      this.status.objects = 0;
    } else {
      this.status.bytes = 0;
      this.status.lines = 0;
    }
    this.stream = this.createStream(options, dbg);
    this.stream.dbg = dbg;
    return this;
  }
  command(push, success, failure, args) {
    success();
  }
  createStream(options, debug) {
    options.read = () => {};
    options.destroy = (error, callback) => {
      callback(error);
    };
    return new stream.Readable(options)
      .once("close", () => debug(`closing`))
      .on("pause", () => debug(`pausing`))
      .on("resume", () => debug(`resuming`))
      .once("end", () => debug(`ending`))
      .on("data", (chunk) => debug(`data '${chunk}'`))
      .once("error", (error) => debug(`error '${error}'`));
  }
  data(chunk) {
    this.emit("data", chunk);
    if (typeof chunk === "object") {
      this.status.objects++;
    } else {
      this.status.bytes += chunk.length;
      this.status.lines += chunk.split("\n").length;
    }
  }
  execute(args) {
    this.emit("execute", args);
    this.status.args = args;
    if (!this.status.pipe) this.stream.on("end", () => this.success());
    this.stream
      .on("data", (chunk) => this.data(chunk))
      .on("error", (error) => this.failure(error));
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      try {
        this.command(
          (chunk, encoding) => this.stream.push(chunk, encoding),
          () => this.stream.push(null),
          (error) => this.stream.destroy(error),
          args
        );
      } catch (error) {
        this.failure(error);
      }
    });
  }
  pipe(destination, options) {
    this.status.pipe = destination.status;
    destination
      .on("error", (error) => this.failure(error))
      .on("end", (status) => {
        this.status.pipe = status;
        this.success();
      });
    return this.stream.pipe(destination, options);
  }
}
class Function extends Readable {
  constructor(options, command) {
    super(options);
    this.command = command;
    return this;
  }
}
class File extends Readable {
  constructor(options) {
    options = {
      ...{
        encoding: "utf8",
        objectMode: false,
      },
      ...options,
    };
    super(options);
    this.fileName = options.fileName;
    this.status.file = this.fileName;
    return this;
  }
  command() {}
  createStream(options, debug) {
    return new fs.ReadStream(options.fileName)
      .setEncoding(options.encoding)
      .on("open", (fd) => debug(`open ${fd}`))
      .on("ready", () => debug(`ready`));
  }
}
class Process extends Readable {
  constructor(options) {
    options = {
      ...{
        encoding: "utf8",
        objectMode: false,
      },
      ...options,
    };
    super(options);
    this.args = options.args;
    this.fileName = options.command;
    this.maxBuffer = 256 * 1024 * 1024;
    this.status.command = this.fileName;
    this.status.args = this.args;
    return this;
  }
  command(push, success, failure, args) {
    const dbg = this.stream.dbg;
    const process = execFile(this.fileName, this.args, {
      encoding: this.encoding,
      maxBuffer: this.maxBuffer,
    });
    process
      .once("close", (code, signal) => dbg(`closing '${code}'`))
      .once("disconnect", () => dbg("disconnecting"))
      .once("error", (error) => dbg(`error '${error}'`))
      .once("exit", (code, signal) => dbg(`exiting '${code}'`))
      .on("message", (message) => dbg(`message '${message}'`));
    process
      .once("close", (code, signal) => {
        this.status.code = signal || code;
        success();
      })
      .once("error", (error) => failure(error));
    process.stderr.pipe(process.stdout);
    process.stdout.on("data", (data) => push(data));
  }
}
class Sql extends Readable {
  constructor(options) {
    options = {
      ...{
        encoding: "utf8",
        objectMode: true,
      },
      ...options,
    };
    super(options);
    this.database = options.database;
    this.sql = options.sql;
    return this;
  }
  createStream(options, debug) {
    options.database.pool
      .on("acquire", (conn) => debug(`acquired ${conn.threadId}`))
      .on("connection", (conn) => debug(`connection ${conn.threadId}`))
      .on("enqueue", () => debug("enqueued"))
      .on("error", (error) => debug(`error '${error}'`))
      .on("release", (conn) => debug(`released '${conn}'`));
    return super.createStream(options, debug);
  }
  async command(push, success, failure, args) {
    let connection;
    const dbg = this.stream.dbg;
    try {
      connection = await this.database.pool.getConnection();
      connection.on("error", (error) => dbg(`error ${error}`));
      const query = await connection
        .queryStream(this.sql, args)
        .on("fields", (fields) => dbg(`fields '${fields}'`))
        .on("data", (row) => dbg(`row '${row}'`))
        .once("end", () => dbg(`ending`))
        .once("error", (error) => dbg(`error '${error}'`))
        .on("data", (row) => push(row))
        .once("end", () => success())
        .once("error", (error) => failure(error));
    } catch (error) {
      failure(error);
    } finally {
      connection.release();
    }
  }
}

module.exports = {
  Readable,
  Function,
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
