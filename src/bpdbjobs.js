const { spawn } = require("child_process");
const {
  DelimitedStream,
  LabeledItem,
  DelimitedItem
} = require("./delimited.js");

class NBU {
  params = {};
  fields = [];
  items = [];
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

  onProcessError = err => {
    console.error("Failed to start subprocess." + err);
    this.onProcessClose(err);
  };
  onProcessClose = exitCode => this.finish(exitCode);

  itemObject = LabeledItem;
  createItem = text => {
    let item = new this.itemObject(this.fields);
    return item.parse(text);
  };
  onItem = item => {
    this.items.push(item);
  };

  streamObject = () => new DelimitedStream();
  createStream = (onStreamData, onStreamEnd) => {
    let stream = this.streamObject();
    stream.on("data", onStreamData);
    stream.on("end", onStreamEnd);
    return stream;
  };
  onStreamData = data => this.onItem(this.createItem(data));
  onStreamEnd = () => {};
  //  onStreamEnd = () => console.log("Stream END");

  createProcess = (onProcessError, onProcessClose) => {
    const encoding = "utf8";
    const command = this.params.path + "\\" + this.params.cmd + ".cmd";
    const process = spawn(command, this.params.args);
    process.on("error", onProcessError);
    process.stdout.setEncoding(encoding);
    process.stdout.pipe(this._stream);
    process.stderr.setEncoding(encoding);
    process.stderr.pipe(this._stream);
    process.on("close", onProcessClose);
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

  onItem = item => {
    this.masterServer = item.masterServer;
    this.items.push(item);
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
  //  itemObject = fields => new DelimitedItem(fields, ",");
  itemObject = DelimitedItem;

  finish(exitCode) {
    super.finish(exitCode);
    console.log(this.items);
  }
}

module.exports = { BpdbjobsSummary, BpdbjobsReportMostColumns };
