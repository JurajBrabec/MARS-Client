const { spawn } = require("child_process");
const { DelimitedStream } = require("./delimited.js");
const { LabeledRows, DelimitedRows } = require("./rows.js");

class command {
  _stream = null;
  _process = null;
  fields = [{ name: "line", type: "string", pattern: /(.*)/u }];

  constructor(path) {
    this.params = { path: path, cmd: null, args: [] };
  }

  onProcessError(err) {
    console.error(
      "ERROR " + err.code + ": Failed to start subprocess " + err.path
    );
    return this;
  }
  onProcessClose(exitCode) {
    return this.finish(exitCode);
  }

  createStream() {
    return new DelimitedStream();
  }
  onStreamData = data => {
    return this.rows.onRow(this.rows.addRow(data));
  };
  onStreamEnd() {}

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
  execute(onProcessClose = this.finish) {
    this.rows = this.createRows(this.fields);
    this._stream = this.createStream()
      .on("data", this.onStreamData)
      .on("end", this.onStreamEnd);
    this._process = this.createProcess(this.onProcessError, onProcessClose);
  }
  finish(exitCode) {
    console.log("Finished. Exit code#" + exitCode);
  }
}

class Bpdbjobs extends command {
  constructor(path) {
    super(path);
    this.params.cmd = "bpdbjobs";
  }
}

class BpdbjobsSummary extends Bpdbjobs {
  constructor(path) {
    super(path);
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
}

class BpdbjobsReportMostColumns extends Bpdbjobs {
  constructor(path) {
    super(path);
    this.params.args = ["-report", "-most_columns"];
  }
  fields = [
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

  finish(exitCode) {
    super.finish(exitCode);
    console.log(this.rows);
  }
}

class NBU {
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
}

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

const bpdbjobsSummary = new BpdbjobsSummary(
  "D:\\Veritas\\Netbackup\\bin\\admincmd\\"
);
//bpdbjobsSummary.onFinish=func;
bpdbjobsSummary.execute(() => {
  const bpdbjobsReportMostColumns = new BpdbjobsReportMostColumns(
    "D:\\Veritas\\Netbackup\\bin\\admincmd\\"
  );
  console.log(bpdbjobsSummary.rows.asSQL("table1"));
  bpdbjobsReportMostColumns.masterServer = bpdbjobsSummary.masterServer;
  bpdbjobsReportMostColumns.execute(() => {
    console.log(bpdbjobsReportMostColumns.rows.asSQL("table2"));
  });
});

console.log(
  "Continuing to do node things while the process runs at the same time..."
);
