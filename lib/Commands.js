const dc = require("debug")("cmd");
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
    if (dc.enabled) {
      this.on("close", () => dc("close"));
      this.on("data", () => dc("data"));
      this.on("end", () => dc("end"));
      this.on("error", () => dc("error"));
      this.on("result", (result) => dc("result:" + result.length));
    }
  }
  throwError(err) {
    dc("error");
    if (this._reject) {
      this._resolve = null;
      process.nextTick(this._reject, err);
      this._reject = null;
    }
    this.emit("end", err);
  }
  successEnd(val) {
    dc("success");
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
  }
  onError = (error) => {
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
        )
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
      const process = execFile(command, _this.params.args).on(
        "error",
        _this.onError
      );
      process.stderr
        .setEncoding(_this._encoding)
        .on("error", _this.onError)
        .pipe(process.stdout);
      process.stdout
        .setEncoding(_this._encoding)
        .on("error", _this.onError)
        .pipe(_this._stream);
    });
  }
}

module.exports = {
  CommandParams,
  Command,
  CommandReadable,
};
