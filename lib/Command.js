const EventEmitter = require("events");
const { execFile } = require("child_process");
const debug = require("debug");
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

class CommandReadable extends Command {
  constructor(command) {
    super();
    this.path = command.path;
    this.binary = command.binary;
    this.args = command.args;
    this.transform = command.transform;
    this._encoding = "utf8";
    this._stream = null;
    this._process = null;
  }
  onProgress = (progress) => {
    this.dbg(`${progress}%`);
  };
  onError = (error) => {
    this._process.kill();
    this.throwError(error);
  };
  onResult = (result) => {
    this.successEnd(result);
  };
  addStream(stream) {
    this._stream = stream.on("error", this.onError).on("result", this.onResult);
    return this;
  }
  asText(limit) {
    this.addStream(new TextWritable());
    return this.getResults(limit);
  }
  asObjects(limit) {
    this.addStream(this.transform.addStream(new ObjectWritable(limit)));
    return this.getResults();
  }
  toDatabase(pool, batchSize = 100, progressTime = 1000) {
    const params = {
      tables: this.transform.converter.tables,
      pool,
      batchSize,
      progressTime,
    };
    this.addStream(
      this.transform.addStream(
        new MariaDbWritable(params).on("progress", this.onProgress)
      )
    );
    return this.getResults();
  }
  getResults() {
    const _this = this;
    try {
      return new Promise(function (resolve, reject) {
        _this._resolve = resolve;
        _this._reject = reject;
        const command = _this.path + "/" + _this.binary + ".exe";
        let args = _this.args;
        if (process.env.NBU_HOME_FAKE) {
          args = args.filter((arg) => !/-t|\d+\//.test(arg));
        }
        _this.dbg("exec " + command + " " + args.join(" "));
        const proc = execFile(command, args, {
          encoding: "utf8",
          maxBuffer: 256 * 1024 * 1024,
        }).on("error", _this.onError);
        proc.stderr
          .setEncoding(_this._encoding)
          .on("error", _this.onError)
          .pipe(proc.stdout);
        proc.stdout
          .setEncoding(_this._encoding)
          .on("error", _this.onError)
          .pipe(_this._stream);
        _this._process = proc;
      });
    } catch (err) {
      console.log("Command ERROR:");
      console.log(err);
    }
  }
}

module.exports = {
  Command,
  CommandReadable,
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
test();
