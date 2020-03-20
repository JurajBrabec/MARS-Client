const {
  DelimitedStream,
  LabeledCommand,
  DelimitedCommand
} = require("./command");

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
  init() {
    let summary = new BpdbjobsSummary(this);
    return new Promise(function(resolve, reject) {
      summary.execute(() => {
        let masterServer = summary.netBackup.masterServer;
        if (masterServer) {
          resolve(masterServer);
        } else {
          reject("Unable to retrieve Master Server name.");
        }
      });
    });
  }
  getSummary() {
    this.summary = new BpdbjobsSummary(this);
    return this.summary.execute();
  }
  getJobs() {
    this.jobs = new BpdbjobsReportMostColumns(this);
    return this.jobs.execute();
  }
}

class BpdbjobsSummary extends LabeledCommand {
  constructor(netBackup) {
    super(netBackup.path, "bpdbjobs", ["-summary", "-l"]);
    this.netBackup = netBackup;
  }
  outputFields = [
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

  createStream = () => new DelimitedStream(/^(?=Summary)/g);
  onStreamData = data => {
    let row = JSON.parse(data);
    //let row = data;
    this.netBackup.masterServer = row.masterServer;
  };
}

class BpdbjobsReportMostColumns extends DelimitedCommand {
  constructor(netBackup) {
    super(netBackup.path, "bpdbjobs", ["-report", "-most_columns"]);
    this.netBackup = netBackup;
    this.outputFields.map(field => {
      if (field.name == "masterServer") field.value = netBackup.masterServer;
    });
  }
  outputFields = [
    {
      name: "masterServer",
      type: "string"
    },
    { name: "jobId", type: "number" },
    { name: "jobType", type: "number" },
    { name: "state", type: "number" },
    { name: "status", type: "number" },
    { name: "policy", type: "string" }
  ];
}

module.exports = { NetBackup };
