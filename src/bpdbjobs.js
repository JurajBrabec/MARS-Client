const { spawn } = require("child_process");
const { DelimitedStream, LabeledRow, DelimitedRow } = require("./delimited.js");

class NBU {
  params = {};
  fields = [];
  rows = [];
  _masterServer = null;
  _stream = null;
  _process = null;

  constructor(path) {
    this.params = { path: path, cmd: null, args: [] };
  }
  get masterServer() {
    return this._masterServer;
  }
  set masterServer(name) {
    this._masterServer = name;
  }

  createFields = [{ name: "line", type: "string", pattern: /(.*)/u }];
  addField = field =>
    this.fields.push({
      name: field.name,
      type: field.type || "string",
      pattern: field.pattern || /(\S+)/u,
      value: field.value
    });

  onProcessError = err =>
    console.error(
      "ERROR " + err.code + ": Failed to start subprocess " + err.path
    );
  onProcessClose = exitCode => this.finish(exitCode);

  //rowClass = LabeledRow;
  //createRow = text => {
  //    let row = new this.rowClass(this.fields);
  //    return row.parse(text);
  //}
  rowObject = () => new Row();
  createRow = text => {
    let row = this.rowObject();
    row.fields = this.fields;
    return row.parse(text);
  };
  onRow = row => (row == undefined ? false : this.rows.push(row));

  streamObject = () => new DelimitedStream();
  createStream = (onStreamData, onStreamEnd) =>
    this.streamObject()
      .on("data", onStreamData)
      .on("end", onStreamEnd);
  onStreamData = data => this.onRow(this.createRow(data));
  onStreamEnd = () => {};

  createProcess = (onProcessError, onProcessClose) => {
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
  };
  execute = (onProcessClose = this.finish) => {
    this.createFields.map(field => this.addField(field));
    this._stream = this.createStream(this.onStreamData, this.onStreamEnd);
    this._process = this.createProcess(this.onProcessError, onProcessClose);
  };
  finish(exitCode) {
    console.log("Finished. Exit code#" + exitCode);
  }
}

class Bpdbjobs extends NBU {
  constructor(path) {
    super(path);
    this.params.cmd = "bpdbjobs";
  }
  rowObject = () => new LabeledRow();
}

class BpdbjobsSummary extends Bpdbjobs {
  constructor(path) {
    super(path);
    this.params.args = ["-summary", "-l"];
  }
  createFields = [
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

  streamObject = () => new DelimitedStream(/^(?=Summary)/g);

  onRow = row => {
    if (row === undefined) return false;
    this.masterServer = row.masterServer;
    this.rows.push(row);
  };
}

class BpdbjobsReportMostColumns extends Bpdbjobs {
  constructor(path) {
    super(path);
    this.params.args = ["-report", "-most_columns"];
  }
  createFields = [
    {
      name: "masterServer",
      type: "string",
      value: this.masterServer
    },
    { name: "jobId", type: "number" },
    { name: "jobType", type: "number" },
    { name: "state", type: "number" },
    { name: "status", type: "number" },
    { name: "policy", type: "string" }
  ];
  //  rowClass = DelimitedRow;
  rowObject = () => new DelimitedRow(",");

  finish(exitCode) {
    super.finish(exitCode);
    console.log(this.rows);
  }
}

module.exports = { BpdbjobsSummary, BpdbjobsReportMostColumns };

const bpdbjobsSummary = new BpdbjobsSummary(
  "M:\\Veritas\\Netbackup\\bin\\admincmd\\"
);
//bpdbjobsSummary.onFinish=func;
bpdbjobsSummary.execute(() => {
  const bpdbjobsReportMostColumns = new BpdbjobsReportMostColumns(
    "M:\\Veritas\\Netbackup\\bin\\admincmd\\"
  );
  console.log(bpdbjobsSummary.rows);
  bpdbjobsReportMostColumns.masterServer = bpdbjobsSummary.masterServer;
  bpdbjobsReportMostColumns.execute(() => {
    console.log(bpdbjobsReportMostColumns.rows);
  });
});

console.log(
  "Continuing to do node things while the process runs at the same time..."
);
