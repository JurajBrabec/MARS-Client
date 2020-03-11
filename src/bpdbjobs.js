const { spawn } = require("child_process");
const Delimited = require("./delimited.js");

class NBU {
  params = {};
  _masterServer = null;
  items = [];
  _stream = null;
  _process = null;
  _pattern = null;

  constructor(path) {
    this.params = { path: path, cmd: null, args: [] };
  }
  get masterServer() {
    return this._masterServer;
  }
  set masterServer(name) {
    this._masterServer = name;
  }
  stream = () => new Delimited();
  createStream = (onData, onEnd) => {
    let stream = this.stream();
    stream.on("data", onData);
    stream.on("end", onEnd);
    return stream;
  };
  processData = data => this.items.push(this.parseData(data));
  endData = () => console.log("END");
  parseData = data => {
    let result = this._pattern.exec(data);
    return result.groups;
  };
  pattern = () => ".*";
  createPattern = () => new RegExp(this.pattern(), "g");
  createProcess = (command, callback) => {
    const process = spawn(command, this.params.args);
    process.on("error", err => {
      console.error("Failed to start subprocess." + err);
      callback(err);
    });
    process.stdout.setEncoding("utf8");
    process.stdout.pipe(this._stream);
    process.stderr.setEncoding("utf8");
    process.stderr.pipe(this._stream);
    process.on("close", callback);
    return process;
  };
  execute = callback => {
    let command = this.params.path + "\\" + this.params.cmd + ".cmd";
    console.log("Starting Process " + command);
    this._pattern = this.createPattern();
    this._stream = this.createStream(this.processData, this.endData);
    this._process = this.createProcess(command, callback);
  };
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
  stream = () => new Delimited(/^(?=Summary)/g);
  pattern = () => {
    let pattern = "";
    pattern += "Summary of jobs on (?<masterServer>\\S+)\\s+";
    pattern += "Queued: +(?<queued>\\d+)\\s+";
    pattern += "Waiting-to-Retry: +(?<waitingToRetry>\\d+)\\s+";
    pattern += "Active: +(?<active>\\d+)\\s+";
    pattern += "Successful: +(?<successful>\\d+)\\s+";
    pattern += "Partially Successful: +(?<PartiallySuccessful>\\d+)\\s+";
    pattern += "Failed: +(?<failed>\\d+)\\s+";
    pattern += "Incomplete: +(?<incomplete>\\d+)\\s+";
    pattern += "Suspended: +(?<suspended>\\d+)\\s+";
    pattern += "Total: +(?<total>\\d+)\\s+";
    return pattern;
  };
  finish = exitCode => {
    this.masterServer = this.items[0].masterServer;
    console.log("Finished. Exit code#" + exitCode);
    console.log("Items: ", this.items);
    console.log("MasterServer:" + this.masterServer);
  };
}
module.exports = BpdbjobsSummary;
