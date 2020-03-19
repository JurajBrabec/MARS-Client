const { Transform } = require("stream");
const { spawn } = require("child_process");
const { LabeledRows, DelimitedRows } = require("./rows.js");

class DelimitedStream extends Transform {
  constructor(delimiter = /\r?\n/g) {
    super({ objectMode: true });
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
      sections.forEach(this.push, this);
    }
    callback();
  }

  _flush(callback) {
    callback(null, this._buffer);
  }
}

class NetBackup {
  constructor(path) {
    this.path = path;
    this._masterServer = null;
  }
  get masterServer() {
    return this._masterServer;
  }
  set masterServer(name) {
    this._masterServer = name;
  }
  getSummary(callback) {
    this.summary = new BpdbjobsSummary(this);
    return this.summary.execute(callback);
  }
  getJobs(callback) {
    this.jobs = new BpdbjobsReportMostColumns(this);
    return this.jobs.execute(callback);
  }
}

class Command {
  _stream = null;
  _process = null;
  _callback = null;
  fields = [{ name: "line", type: "string", pattern: /(.*)/u }];

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
    if (typeof this._callback === "function") this._callback(exitCode);
  };
  onFinish = exitCode => {
    return this.finish(exitCode);
  };

  createStream() {
    return new DelimitedStream();
  }
  onStreamData = data => {
    return this.rows.addRow(data);
  };
  onStreamEnd = () => {};

  createRows(fields) {
    return new DelimitedRows(fields);
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
    this._callback = callback;
    this.rows = this.createRows(this.fields);
    this._stream = this.createStream()
      .on("data", this.onStreamData)
      .on("end", this.onStreamEnd);
    this._process = this.createProcess(
      this.onProcessError,
      this.onProcessClose
    );
  }
  finish(exitCode) {
    console.log("Finished. Exit code#" + exitCode);
    return this;
  }
}

class Bpdbjobs extends Command {
  constructor(netBackup) {
    super(netBackup.path, "bpdbjobs");
    this.netBackup = NetBackup;
  }
}

class BpdbjobsSummary extends Bpdbjobs {
  constructor(netBackup) {
    super(netBackup);
    this.params.args = ["-summary", "-l"];
  }
  fields = [
    {
      name: "masterServer",
      type: "string",
      pattern: /Summary of jobs on (\S+)/u
    },
    { name: "queued", type: "number", pattern: /Queued:\s+(\d+)/u },
    {
      name: "waitingToRetry",
      type: "number",
      pattern: /Waiting-to-Retry:\s+(\d+)/u
    },
    { name: "active", type: "number", pattern: /Active:\s+(\d+)/u },
    { name: "successful", type: "number", pattern: /Successful:\s+(\d+)/u },
    {
      name: "partiallySucessful",
      type: "number",
      pattern: /Partially Successful:\s+(\d+)/u
    },
    { name: "failed", type: "number", pattern: /Failed:\s+(\d+)/u },
    { name: "incomplete", type: "number", pattern: /Incomplete:\s+(\d+)/u },
    { name: "suspended", type: "number", pattern: /Suspended:\s+(\d+)/u },
    { name: "total", type: "number", pattern: /Total:\s+(\d+)/u },
    { name: "updatedOn", type: "datetime", value: "NOW" }
  ];

  createRows(fields) {
    return new LabeledRows(fields);
  }
  createStream() {
    return new DelimitedStream(/^(?=Summary)/g);
  }
  finish(exitCode) {
    this.netBackup.masterServer = this.rows.rows[0].masterServer;
    super.finish(exitCode);
  }
}

class BpdbjobsReportMostColumns extends Bpdbjobs {
  constructor(netBackup) {
    super(netBackup);
    this.params.args = ["-report", "-most_columns"];
  }
  fields = [
    {
      name: "masterServer",
      type: "string",
      value: this.netBackup.masterServer
    },
    { name: "jobId", type: "number" },
    { name: "jobType", type: "number" },
    { name: "state", type: "number" },
    { name: "status", type: "number" },
    { name: "policy", type: "string" }
  ];
}

module.exports = { NetBackup };
function testRows() {
  text = "Master Server: testServer\nData Server: anotherServer";
  //text = "aaa,bbb";

  //rows = new DelimitedRows([], ",");
  rows = new LabeledRows([]);
  rows.addField("id", "number", "", 1);
  rows.addField("masterServer", "string", /Master Server: (\S+)/u);
  rows.addField("dataServer", "string", /Data Server: (\S+)/u);
  rows.addField("created", "datetime", "", "2020-03-14 15:30");
  //console.log(rows.parseText(text));
  rows.addRow(text);
  rows.addRow(text);
  console.log(rows.asJSON());
}
