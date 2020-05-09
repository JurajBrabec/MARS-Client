const debug = require("debug");
const EventEmitter = require("events");
const { execFile } = require("child_process");
const fs = require("fs");
const bbPromise = require("bluebird");
const {
  ConvertTransform,
  TextWritable,
  ObjectWritable,
  MariaDbWritable,
} = require("./Stream");

class Command extends EventEmitter {
  constructor(resolve, reject) {
    super();
    this._resolve = resolve;
    this._reject = reject;
    this.dbg = debug("command");
    this.status = { commmands: 1 };
    if (this.dbg.enabled) {
      this.on("close", () => this.dbg("close"));
      this.on("data", () => this.dbg("data"));
      this.on("end", () => this.dbg("end"));
      this.on("error", () => this.dbg("error"));
      this.on("result", (result) => this.dbg("result:" + result.length));
    }
  }
  throwError(err) {
    this.dbg("error");
    if (this._reject) {
      this._resolve = null;
      process.nextTick(this._reject, err);
      this._reject = null;
    }
    this.emit("end", err);
  }
  successEnd(val) {
    this.dbg("success");
    if (this._resolve) {
      this._reject = null;
      process.nextTick(this._resolve, val);
      this._resolve = null;
      this.emit("end");
    }
  }
}

class FileReadable extends Command {
  constructor(command) {
    super();
    this.path = command.path;
    this.file = command.file;
    this.transform =
      command.transporm instanceof ConvertTransform
        ? command.transform
        : new ConvertTransform(command.transform);
    this._encoding = "utf8";
    this._stream = null;
    this.dbg = debug("file:readable");
  }
  onError = (error) => {
    this.status.error = error;
    this.throwError(error);
  };
  onResult = (result) => {
    if (result.rows) {
      this.status.commands = 1;
      this.status.rows = result.rows;
      this.status.duration = result.duration;
      this.status.sqlDuration = result.duration;
      this.status.sqls = result.sqls;
      this.status.warnings = result.warnings;
      this.status.errors = result.errors;
      if (result.errors) this.status.messages = result.messages;
      result = this.status;
    } else {
      this.status.rows = result.length;
    }
    this.successEnd(result);
  };
  test() {
    const result = {
      source: this.constructor.name,
      status: undefined,
    };
    const command = this.path + "/" + this.file;
    return new Promise((resolve, reject) => {
      fs.access(command, fs.constants.F_OK, (err) => {
        if (err) {
          result.error = err.code;
          result.status = err.message;
          resolve(result);
        } else {
          result.status = "OK";
          resolve(result);
        }
      });
    });
  }
  addStream(stream) {
    this._stream = stream.on("error", this.onError).on("result", this.onResult);
    return this;
  }
  asText(limit) {
    this.transform.limit = limit;
    this.addStream(new TextWritable());
    return this.getResults();
  }
  asObjects(limit) {
    this.transform.limit = limit;
    this.addStream(this.transform.addStream(new ObjectWritable()));
    return this.getResults();
  }
  toDatabase(database, batchSize = 2048, progressTime = 1000) {
    const params = {
      tables: this.transform.converter.tables,
      database,
      batchSize,
      progressTime,
    };
    this.addStream(
      this.transform.addStream(
        new MariaDbWritable(params).on("progress", (progress) =>
          this.emit("progress", progress)
        )
      )
    );
    return this.getResults();
  }
  fileContents(data) {
    return data;
  }
  getResults() {
    return new Promise(async (resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
      const command = this.path + "/" + this.file;
      this.dbg("start", command);
      fs.readFile(command, "utf8", (err, data) => {
        if (err) return this.onError(err);
        this._stream.end(data);
      });
    });
  }
}

class CommandReadable extends Command {
  constructor(command) {
    super();
    this.path = command.path;
    this.binary = command.binary;
    this.args = command.args;
    this.transform =
      command.transporm instanceof ConvertTransform
        ? command.transform
        : new ConvertTransform(command.transform);
    this._encoding = "utf8";
    this._stream = null;
    this._process = null;
    this.dbg = debug("command:readable");
    this._startTime = new Date();
    this._commands = 0;
  }
  get duration() {
    const result = (new Date() - this._startTime) / 1000;
    return Number(result.toFixed(2));
  }
  onError = (error) => {
    if (this._process) this._process.kill();
    this.status.commands = this._commands;
    this.status.duration = this.duration;
    this.status.error = error;
    this.throwError(error);
  };
  onResult = (result) => {
    this.status.commands = this._commands;
    this.status.duration = this.duration;
    if (result.rows) {
      this.status.rows = result.rows;
      this.status.sqlDuration = result.duration;
      this.status.sqls = result.sqls;
      this.status.warnings = result.warnings;
      this.status.errors = result.errors;
      if (result.errors) this.status.messages = result.messages;
      result = this.status;
    } else {
      this.status.rows = result.lenght;
    }
    this.successEnd(result);
  };
  test() {
    const result = {
      source: this.constructor.name,
      status: undefined,
    };
    const command = this.path + "/" + this.binary + ".exe";
    return new Promise((resolve, reject) => {
      fs.access(command, fs.constants.F_OK | fs.constants.X_OK, (err) => {
        if (err) {
          result.error = err.code;
          result.status =
            err.code === "ENOENT" ? "not found" : "is not executable";
          resolve(result);
        } else {
          result.status = "OK";
          resolve(result);
        }
      });
    });
  }
  addStream(stream) {
    this._stream = stream.on("error", this.onError).on("result", this.onResult);
    return this;
  }
  asText(limit) {
    this.transform.limit = limit;
    this.addStream(new TextWritable());
    return this.getResults();
  }
  asObjects(limit) {
    this.transform.limit = limit;
    this.addStream(this.transform.addStream(new ObjectWritable()));
    return this.getResults();
  }
  toDatabase(database, batchSize = 2048, progressTime = 1000) {
    const params = {
      tables: this.transform.converter.tables,
      database,
      batchSize,
      progressTime,
    };
    this.addStream(
      this.transform.addStream(
        new MariaDbWritable(params).on("progress", (progress) =>
          this.emit("progress", progress)
        )
      )
    );
    return this.getResults();
  }
  makeProgress(delta, count) {
    if (!this.progress)
      this.progress = {
        source: "Command",
        count: 0,
        done: 0,
        percent: 0,
        message: "",
        time: new Date(),
      };
    if (count) this.progress.count = count;
    this.progress.done += delta;
    this.progress.percent = Math.floor(
      (100 * this.progress.done) / this.progress.count
    );
    const message = `${this.progress.percent}%`;
    if (this.progress.message !== message) {
      this.progress.message = message;
      const time = new Date();
      this.progress.time = Number(
        ((time - this.progress.time) / 1000).toFixed(2)
      );
      this.emit("progress", this.progress);
      this.progress.time = time;
    }
  }
  getItems() {}
  getResults() {
    return new Promise(async (resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
      let items = await this.getItems();
      if (items) {
        this.dbg("start", items.length);
        this.makeProgress(0, items.length);
        bbPromise
          .map(
            items,
            async (item) => {
              try {
                const text = await this.getItems(item).asText();
                this._stream.write(text);
                this._commands++;
                this.makeProgress(1);
              } catch (err) {
                this.onError(err);
              }
            },
            { concurrency: this.concurrency }
          )
          .then(() => this._stream.end(null))
          .catch((err) => this.onError(err));
      } else {
        const command = this.path + "/" + this.binary + ".exe";
        this.dbg("start", [command, ...this.args].join(" "));
        const proc = execFile(command, this.args, {
          encoding: "utf8",
          maxBuffer: 256 * 1024 * 1024,
        })
          .on("error", (err) => this.onError)
          .on("exit", (code) => {
            this.emit("exit", code);
          });
        proc.stderr.pipe(proc.stdout);
        proc.stdout.pipe(this._stream);
        this._process = proc;
        this._commands++;
      }
    });
  }
}

module.exports = {
  Command,
  CommandReadable,
  FileReadable,
};

function test() {
  const { Tables } = require("./Data");
  const { SeparatedConvert } = require("./Convert");
  const util = require("util");

  const fields = [
    { fieldName1: "string" }, //typed, default undefined
    { fieldName2: "number" }, //typed, default undefined
    { fieldName3: "float" }, //typed, default undefined
    { fieldName4: "date" }, //typed, default undefined
    { fieldName6: "textValue" }, //type derived from value
    { fieldName7: 100 }, //type derived from value
    { fieldName8: 1.5 }, //type derived from value
    { fieldName9: new Date() }, //type derived from value
    { fieldName0: /bla:(\d+)/ }, //type derived from regExp, default undefined
    { fieldNameA: "...", key: true }, //key field does not update on insert
    { fieldNameB: "...", ignore: true }, //ignored does not insert/update
  ];

  const tables = new Tables([
    { name: "tableName1", fields },
    { name: "tableName2", fields },
  ]);
  try {
    const transform = new ConvertTransform({
      delimiter: /\n/,
      expect: /^Summary/,
      convert: new SeparatedConvert({ tables, separator: / / }),
    });
    const cmd = new CommandReadable({
      path: "D:/Veritas/NetBackup/bin/admincmd",
      binary: "bpdbjobs",
      args: ["-summary", "-l"],
      transform,
    });
    cmd
      .asObjects(2)
      .then((res) => console.log(util.inspect(res, false, null, true)))
      .catch((err) => {
        if (
          err instanceof SyntaxError ||
          err instanceof ReferenceError ||
          err instanceof TypeError
        )
          throw err;
        console.log(`Command ERROR: ${err.message}`);
      });
  } catch (err) {
    if (
      err instanceof SyntaxError ||
      err instanceof ReferenceError ||
      err instanceof TypeError
    )
      throw err;
    console.log(`Test ERROR: ${err.message}`);
  }
}
//test();
