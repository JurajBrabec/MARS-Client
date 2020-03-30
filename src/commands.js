const dr = require("debug")("readable");
const EventEmitter = require("events");
const { execFile } = require("child_process");
const { TextWritable, ObjectWritable, MariaDbWritable } = require("./streams");
const { DelimitedTransform, LabeledTransform } = require("./streams");

class Command extends EventEmitter {
  constructor(resolve, reject) {
    super();
    this.resolve = resolve;
    this.reject = reject;
  }
  throwError(err) {
    if (this.reject) {
      this.resolve = null;
      process.nextTick(this.reject, err);
      this.reject = null;
    }
    this.emit("end", err);
  }
  successEnd(val) {
    if (this.resolve) {
      this.reject = null;
      process.nextTick(this.resolve, val);
      this.resolve = null;
      this.emit("end");
    }
  }
}

class CommandReadable extends Command {
  constructor(params) {
    dr("init");
    super();
    this.encoding = "utf8";
    this.params = params;
    this.stream = null;
    if (dr.enabled) {
      this.on("close", () => dr("close"));
      this.on("data", () => dr("data"));
      this.on("end", () => dr("end"));
      this.on("error", () => dr("error"));
      this.on("result", result => dr("result:" + result.length));
    }
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
    this.stream = stream
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
      _this.resolve = resolve;
      _this.reject = reject;
      const command = _this.params.path + "/" + _this.params.binary + ".exe";
      const process = execFile(command, _this.params.args).on(
        "error",
        _this.onProcessError
      );
      process.stderr
        .setEncoding(_this.encoding)
        .on("error", _this.onReadableError)
        .pipe(process.stdout);
      process.stdout
        .setEncoding(_this.encoding)
        .on("error", _this.onReadableError)
        .pipe(_this.stream);
    });
  }
}

module.exports = {
  Command,
  CommandReadable
};
