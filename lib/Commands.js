const EventEmitter = require("events");
const { execFile } = require("child_process");
const {
  ConverterTransform,
  TextWritable,
  ObjectWritable,
  MariaDbWritable,
} = require("./Streams");

class CommandParams {
  path = "";
  binary = "";
  args = [];
  transformParams = [];
}
class Command extends EventEmitter {
  constructor(resolve, reject) {
    super();
    this._resolve = resolve;
    this._reject = reject;
    this.dbg = require("debug")("command");
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
  constructor(params) {
    super();
    this.params = params;
    this._encoding = "utf8";
    this._stream = null;
    this._process = null;
  }
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
  asText() {
    this.addStream(new TextWritable());
    return this.getResults();
  }
  asObjects(limit) {
    this.addStream(
      new ConverterTransform(this.params.transformParams).addStream(
        new ObjectWritable(limit)
      )
    );
    return this.getResults();
  }
  toDatabase(pool, batchSize) {
    this.addStream(
      new ConverterTransform(this.params.transformParams).addStream(
        new MariaDbWritable(
          this.params.transformParams.converterParams.dataDefinition,
          pool,
          batchSize
        ).on("tick", (res) => this.dbg(`tick : ${res}%`))
      )
    );
    return this.getResults();
  }
  getResults() {
    const _this = this;
    return new Promise(function (resolve, reject) {
      _this._resolve = resolve;
      _this._reject = reject;
      const command = _this.params.path + "/" + _this.params.binary + ".exe";
      const process = execFile(command, _this.params.args, {
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
      }).on("error", _this.onError);
      process.stderr
        .setEncoding(_this._encoding)
        .on("error", _this.onError)
        .pipe(process.stdout);
      process.stdout
        .setEncoding(_this._encoding)
        .on("error", _this.onError)
        .pipe(_this._stream);
      _this._process = process;
    });
  }
}

module.exports = {
  CommandParams,
  Command,
  CommandReadable,
};
