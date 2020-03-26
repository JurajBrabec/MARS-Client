var debug = require("debug")("command");
const EventEmitter = require("events");
const { execFile } = require("child_process");
const { TextWritable, ObjectWritable, MariaDbWritable } = require("./streams");

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

class CommandReadable {
  constructor(path, cmd, args) {
    this.params = { path, cmd, args };
    this._transform = null;
    this._writable = null;
    this._process = null;
    this.sentItems = 0;
  }
  onData = data => {
    this.sentItems++;
    return this;
  };
  onError = err => {
    this._transform.end(err);
    return this;
  };
  onClose = exitCode => {
    debug(`Readable sent ${this.sentItems} items`);
    return this;
  };

  transform = () => {};

  asText() {
    this._transform = new TextWritable();
    return this.execute();
  }
  asObjects() {
    this._transform = this.transform();
    this._writable = new ObjectWritable();
    return this.execute();
  }
  toDatabase(connection, batchSize) {
    this._transform = this.transform();
    this._writable = new MariaDbWritable(
      connection,
      this.table,
      this.fields,
      batchSize
    );
    return this.execute();
  }
  execute() {
    let result;
    const command = this.params.path + "\\" + this.params.cmd + ".exe";
    this._process = execFile(command, this.params.args)
      .on("error", this.onError)
      .on("close", this.onClose);
    const encoding = "utf8";
    this._transform.on("error", this.onError).on("data", this.onData);
    this._transform.fields = this.fields;
    this._process.stdout.setEncoding(encoding).pipe(this._transform);
    this._process.stderr.setEncoding(encoding).pipe(this._transform);
    result = this._transform;
    if (this._writable) {
      this._transform.pipe(this._writable);
      result = this._writable;
    }
    return new Promise(function(resolve, reject) {
      result.resolve = resolve;
      result.reject = reject;
    });
  }
}

module.exports = {
  Command,
  CommandReadable
};
