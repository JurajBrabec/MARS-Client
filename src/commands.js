const dc = require("debug")("cmd");
const EventEmitter = require("events");
const { execFile } = require("child_process");
const { TextWritable, ObjectWritable, MariaDbWritable } = require("./streams");
const { DelimitedTransform, LabeledTransform } = require("./streams");

class Command extends EventEmitter {
  constructor(resolve, reject) {
    dc("init");
    super();
    this._resolve = resolve;
    this._reject = reject;
    if (dc.enabled) {
      this.on("close", () => dc("close"));
      this.on("data", () => dc("data"));
      this.on("end", () => dc("end"));
      this.on("error", () => dc("error"));
      this.on("result", result => dc("result:" + result.length));
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
  onProcessError = error => {
    this.throwError(error);
  };
  onReadableError = error => {
    this.throwError(error);
  };
  onStreamError = error => {
    this.throwError(error);
  };
  onStreamResult = result => {
    this.successEnd(result);
  };
  addStream(stream) {
    this._stream = stream
      .on("error", this.onStreamError)
      .on("result", this.onStreamResult);
    return this;
  }
  asText() {
    this.addStream(new TextWritable(this.params));
    return this.getResults();
  }
  getTransform(params) {
    const TransformType = this.params.separator
      ? DelimitedTransform
      : LabeledTransform;
    return new TransformType(params);
  }
  asObjects() {
    this.addStream(
      this.getTransform(this.params).addStream(new ObjectWritable(this.params))
    );
    return this.getResults();
  }
  toDatabase(pool, batchSize) {
    this.addStream(
      this.getTransform(this.params).addStream(
        new MariaDbWritable(this.params, pool, batchSize)
      )
    );
    return this.getResults();
  }
  getResults() {
    const _this = this;
    return new Promise(function(resolve, reject) {
      _this._resolve = resolve;
      _this._reject = reject;
      const command = _this.params.path + "/" + _this.params.binary + ".exe";
      const process = execFile(command, _this.params.args).on(
        "error",
        _this.onProcessError
      );
      process.stderr
        .setEncoding(_this._encoding)
        .on("error", _this.onReadableError)
        .pipe(process.stdout);
      process.stdout
        .setEncoding(_this._encoding)
        .on("error", _this.onReadableError)
        .pipe(_this._stream);
    });
  }
}

module.exports = {
  Command,
  CommandReadable
};
