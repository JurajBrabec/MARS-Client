const { DelimitedTransform, LabeledTransform } = require("./streams");
const { Command, CommandReadable } = require("./commands");

function netBackup(path) {
  return new Promise((resolve, reject) => new NetBackup(resolve, reject, path));
}
class NetBackup extends Command {
  constructor(resolve, reject, path) {
    super(resolve, reject);
    this.path = path;
    this._masterServer = null;
    this.init();
  }
  get masterServer() {
    return this._masterServer;
  }
  set masterServer(name) {
    this._masterServer = name;
  }
  async init() {
    try {
      const obj = await this.summary().asObjects();
      this.masterServer = obj.masterServer;
      this.successEnd(this);
    } catch (err) {
      this._masterServer = null;
      this.throwError(err);
    }
  }
  summary() {
    return new BpdbJobsSummaryCommand(this);
  }

  jobs() {
    return new BpdbJobsReportCommand(this);
  }
  slps() {
    return new NbStlCommand(this);
  }
}

class NetBackupCommand extends CommandReadable {
  constructor(netBackup, cmd, args = []) {
    super(netBackup.path, cmd, args);
    this.netBackup = netBackup;
  }
  get masterServer() {
    return this.netBackup._masterServer;
  }
  set masterServer(name) {
    this.netBackup._masterServer = name;
  }
}

class BpdbJobsSummaryTransform extends LabeledTransform {
  validateRow = row => {
    if (row.masterServer == null) return false;
    return row;
  };
}
class BpdbJobsSummaryCommand extends NetBackupCommand {
  constructor(netBackup) {
    const binary = "/bin/admincmd/bpdbjobs";
    const args = ["-summary", "-l"];
    super(netBackup, binary, args);
    this.table = "bpdbjobs_summary";
    this.fields = [
      {
        name: "masterServer",
        type: "string",
        pattern: /Summary of jobs on (\S+)/
      },
      {
        name: "queued",
        type: "number",
        pattern: /Queued:\s+(\d+)/,
        update: true
      },
      {
        name: "waiting",
        type: "number",
        pattern: /Waiting-to-Retry:\s+(\d+)/,
        update: true
      },
      {
        name: "active",
        type: "number",
        pattern: /Active:\s+(\d+)/,
        update: true
      },
      {
        name: "successful",
        type: "number",
        pattern: /Successful:\s+(\d+)/,
        update: true
      },
      {
        name: "partial",
        type: "number",
        pattern: /Partially Successful:\s+(\d+)/,
        update: true
      },
      {
        name: "failed",
        type: "number",
        pattern: /Failed:\s+(\d+)/,
        update: true
      },
      {
        name: "incomplete",
        type: "number",
        pattern: /Incomplete:\s+(\d+)/,
        update: true
      },
      {
        name: "suspended",
        type: "number",
        pattern: /Suspended:\s+(\d+)/,
        update: true
      },
      {
        name: "total",
        type: "number",
        pattern: /Total:\s+(\d+)/,
        update: true
      }
    ];
  }
  transform = () => new BpdbJobsSummaryTransform(/^(?=Summary)/);
}

class BpdbJobsReportTransform extends DelimitedTransform {
  validateRow = row => {
    if (row === undefined || row.jobId === null) return false;
    return row;
  };
}
class BpdbJobsReportCommand extends NetBackupCommand {
  constructor(netBackup) {
    const binary = "/bin/admincmd/bpdbjobs";
    const args = ["-report", "-most_columns"];
    super(netBackup, binary, args);
    this.table = "bpdbjobs_report";
    this.fields = [
      { name: "jobId", type: "number" },
      { name: "jobType", type: "number" },
      { name: "state", type: "number", update: true },
      { name: "status", type: "number", update: true },
      { name: "policy", type: "string" },
      { name: "schedule", type: "string" },
      { name: "client", type: "string" },
      { name: "server", type: "string" },
      { name: "started", type: "number" },
      { name: "elapsed", type: "number", update: true },
      { name: "ended", type: "number", update: true },
      { name: "stunit", type: "string" },
      { name: "tries", type: "number", update: true },
      { name: "operation", type: "string" },
      { name: "kbytes", type: "number", update: true },
      { name: "files", type: "number", update: true },
      { name: "pathlastwritten", type: "string", update: true },
      { name: "percent", type: "number", update: true },
      { name: "jobpid", type: "number" },
      { name: "owner", type: "string" },
      { name: "subtype", type: "number" },
      { name: "policytype", type: "number" },
      { name: "scheduletype", type: "number" },
      { name: "priority", type: "number" },
      { name: "group", type: "string" },
      {
        name: "masterServer",
        type: "string"
      },
      { name: "retentionlevel", type: "number" },
      { name: "retentionperiod", type: "number" },
      { name: "compression", type: "number" },
      { name: "kbytestobewritten", type: "number", update: true },
      { name: "filestobewritten", type: "number", update: true },
      { name: "filelistcount", type: "number", update: true },
      { name: "trycount", type: "number", update: true },
      { name: "parentjob", type: "number" },
      { name: "kbpersec", type: "number", update: true },
      { name: "copy", type: "number", update: true },
      { name: "robot", type: "string" },
      { name: "vault", type: "string" },
      { name: "profile", type: "string" },
      { name: "session", type: "string" },
      { name: "ejecttapes", type: "string" },
      { name: "srcstunit", type: "string" },
      { name: "srcserver", type: "string" },
      { name: "srcmedia", type: "string" },
      { name: "dstmedia", type: "string" },
      { name: "stream", type: "number" },
      { name: "suspendable", type: "number" },
      { name: "resumable", type: "number" },
      { name: "restartable", type: "number" },
      { name: "datamovement", type: "number" },
      { name: "snapshot", type: "number" },
      { name: "backupid", type: "string" },
      { name: "killable", type: "number" },
      { name: "controllinghost", type: "number" },
      { name: "offhosttype", type: "number" },
      { name: "ftusage", type: "number" },
      //    { name: "queuereason", type: "number" },
      { name: "reasonstring", type: "number" },
      { name: "dedupratio", type: "number", update: true },
      { name: "accelerator", type: "number" },
      { name: "instancedbname", type: "string" },
      { name: "rest1", type: "string" },
      { name: "rest2", type: "string" }
    ];
  }
  transform = () => new BpdbJobsReportTransform(/\r?\n/, /,/);
}

class NbstlTransform extends DelimitedTransform {
  createRows(section, fields = this.fields) {
    let mainFields = [];
    let rows = [];
    section.split(/\r?\n\s*/m).forEach((line, index) => {
      if (line == "") return;
      if (index == 0) {
        const row = super.createRows(line, fields);
        mainFields = this.fields.map(field => {
          let result = { ...field };
          if (row[field.name] !== undefined) result.value = row[field.name];
          return result;
        });
      } else {
        const row = super.createRows(line, mainFields);
        rows.push(row);
      }
    });
    return rows;
  }

  validateRow = row => {
    if (row.useFor === undefined) return false;
    Object.entries(row).forEach(([key, value]) => {
      if (value == "*NULL*") row[key] = null;
      if (value == "NOW()")
        row[key] = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
    });
    return row;
  };
}

class NbStlCommand extends NetBackupCommand {
  constructor(netBackup) {
    const binary = "/bin/admincmd/nbstl";
    const args = ["-l"];
    super(netBackup, binary, args);
    this.table = "nbstl";
    this.fields = [
      { name: "masterServer", type: "string", value: this.masterServer },
      { name: "slpName", type: "string" },
      { name: "dataClassification", type: "string", update: true },
      { name: "duplicationPriority", type: "string", update: true },
      { name: "state", type: "string", update: true },
      { name: "version", type: "string", update: true },
      { name: "useFor", type: "string", update: true },
      { name: "storageUnit", type: "string", update: true },
      { name: "volumePool", type: "string", update: true },
      { name: "mediaOwner", type: "string", update: true },
      { name: "retentionType", type: "string", update: true },
      { name: "retentionLevel", type: "string", update: true },
      { name: "alternateReadServer", type: "string", update: true },
      { name: "preserveMpx", type: "string", update: true },
      { name: "ddoState", type: "string", update: true },
      { name: "source", type: "string", update: true },
      { name: "unused", type: "string, update:true" },
      { name: "operationId", type: "string", update: true },
      { name: "operationIndex", type: "string" },
      { name: "slpWindow", type: "string", update: true },
      { name: "targetMaster", type: "string", update: true },
      { name: "targetMasterSlp", type: "string", update: true },
      { name: "updated", type: "datetime", value: "NOW()", update: true },
      { name: "obsoleted", type: "datetime", value: null, update: true }
    ];
  }
  transform = () => new NbstlTransform(/^(?=[A-Za-z]+)/m, /\s/);
}
module.exports = { netBackup };
