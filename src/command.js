const stream = require("stream");
const { spawn } = require("child_process");

class DelimitedStream extends stream.Transform {
  constructor(delimiter = /\r?\n/g) {
    super({ readableObjectMode: true, writableObjectMode: true });
    this._delimiter =
      delimiter instanceof RegExp ? delimiter : new RegExp(delimiter, "g");
    this._encoding = "utf8";
    this._buffer = "";
    this._first = true;
  }
  _transform(chunk, encoding, callback) {
    if (encoding === "buffer") {
      this._buffer += chunk.toString(this._encoding);
    } else if (encoding === this._encoding) {
      this._buffer += chunk;
    } else {
      this._buffer += Buffer.from(chunk, encoding).toString(this._encoding);
    }
    if (this._delimiter.test(this._buffer)) {
      let sections = this._buffer.split(this._delimiter);
      this._buffer = sections.pop();
      sections.forEach(section => {
        let row = this.command.parseText(section);
        this.push(JSON.stringify(row));
        //this.push(row);
      }, this);
    }
    callback();
  }

  _flush(callback) {
    let row = this.command.parseText(this._buffer);
    if (row !== null) callback(null, JSON.stringify(row));
    //if (row !== null) callback(null, row);
  }
}

class Command {
  _stream = null;
  _process = null;
  _callback = null;
  outputFields = [{ name: "line", type: "string", pattern: /(.*)/u }];

  constructor(path, cmd, args = []) {
    this.params = { path, cmd, args };
  }

  onProcessError = err => {
    console.error(
      "ERROR " + err.code + ": Failed to start subprocess " + err.path
    );
    return this;
  };
  onProcessClose = exitCode => {
    this.onFinish(exitCode);
    this.finish(exitCode);
    return this;
  };
  onFinish = exitCode => {
    //    console.log("Finished. Exit code#" + exitCode);
    return this;
  };

  createStream = () => new DelimitedStream();
  onStreamData = data => {};
  onStreamEnd = () => {};

  parseText() {
    let row = {};
    this.outputFields.forEach(field => {
      row[field.name] = field.value;
    });
    return row;
  }
  createProcess(onProcessError, onProcessClose) {
    const encoding = "utf8";
    const command = this.params.path + "\\" + this.params.cmd + ".cmd";
    const process = spawn(command, this.params.args)
      .on("error", onProcessError)
      .on("close", onProcessClose);
    process.stdout.setEncoding(encoding);
    process.stdout.pipe(this._stream);
    process.stderr.setEncoding(encoding);
    process.stderr.pipe(this._stream);
    return process;
  }
  execute(callback) {
    let cmd = this;
    cmd._callback = callback;
    cmd._stream = cmd
      .createStream()
      .on("data", cmd.onStreamData)
      .on("end", cmd.onStreamEnd);
    cmd._stream.command = cmd;
    cmd._process = cmd.createProcess(cmd.onProcessError, cmd.onProcessClose);
    if (callback) {
      return this._stream;
    } else {
      return new Promise(function(resolve, reject) {
        resolve(cmd._stream);
      });
    }
  }

  finish(exitCode) {
    if (typeof this._callback === "function") this._callback(exitCode);
    return this;
  }
}

class LabeledCommand extends Command {
  parseText(text) {
    let row = super.parseText(text);
    this.outputFields.forEach(field => {
      let match =
        field.pattern instanceof RegExp ? field.pattern.exec(text) : false;
      if (match) row[field.name] = match[1];
    });
    return row;
  }
}

class DelimitedCommand extends Command {
  delimiter = ",";
  constructor(path, cmd, args = [], delimiter = ",") {
    super(path, cmd, args);
    this.delimiter = delimiter;
  }
  parseText(text) {
    if (text == "") return null;
    let row = super.parseText(text);
    let match = text.split(this.delimiter);
    this.outputFields
      .filter(field => field.value === undefined)
      .forEach((field, index) => {
        if (index < match.length) row[field.name] = match[index];
      });
    return row;
  }
}

module.exports = { DelimitedStream, LabeledCommand, DelimitedCommand };
