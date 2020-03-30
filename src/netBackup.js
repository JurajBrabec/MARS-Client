const dn = require("debug")("nbu");
const {
  DelimitedTransform,
  LabeledTransform,
  HeaderRowsDelimitedTransform
} = require("./streams");
const { Command, CommandReadable } = require("./commands");

class NetBackup extends Command {
  constructor(resolve, reject, path) {
    dn("init");
    super(resolve, reject);
    this.params = { path };
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
      this.masterServer = obj[0].masterServer;
      this.successEnd(this);
    } catch (err) {
      this._masterServer = null;
      this.throwError(err);
    }
  }
  validateValue(value) {
    let result;
    switch (value) {
      case "*NULL*":
        result = null;
        break;
      case "masterServer":
        result = this.masterServer;
        break;
      case "NOW()":
        result = this.now();
        break;
      default:
        result = value;
        break;
    }
    return result;
  }
  now() {
    return new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
  }
  summary() {
    dn("summary");
    return new NetBackupCommand(this, BpdbJobsSummary);
  }

  jobs() {
    dn("jobs");
    return new NetBackupCommand(this, BpdbJobsReport);
  }
  slps() {
    dn("slps");
    return new NetBackupCommand(this, Nbstl);
  }
  clients() {
    dn("clients");
    return new NetBackupCommand(this, BpplClients);
  }
  policies() {
    dn("policies");
    return new NetBackupCommand(this, BpplList);
  }
}

class NetBackupCommand extends CommandReadable {
  constructor(netBackup, params) {
    dn("init command");
    params.path = netBackup.params.path;
    super(params);
    this.netBackup = netBackup;
  }
  get masterServer() {
    return this.netBackup._masterServer;
  }
  set masterServer(name) {
    this.netBackup._masterServer = name;
  }
  getTransform(params) {
    const TransformType = this.params.transform;
    return new TransformType(this.netBackup, params);
  }
}

class NetBackupLabeledTransform extends LabeledTransform {
  constructor(netBackup, params) {
    super(params);
    this.netBackup = netBackup;
  }
  validateValue(value) {
    let result = super.validateValue(value);
    result = this.netBackup.validateValue(result);
    return result;
  }
}
class NetBackupDelimitedTransform extends DelimitedTransform {
  constructor(netBackup, params) {
    super(params);
    this.netBackup = netBackup;
  }
  validateValue(value) {
    let result = super.validateValue(value);
    result = this.netBackup.validateValue(result);
    return result;
  }
}
class NetBackupHeaderRowsDelimitedTransform extends HeaderRowsDelimitedTransform {
  constructor(netBackup, params) {
    super(params);
    this.netBackup = netBackup;
  }
  validateValue(value) {
    let result = super.validateValue(value);
    result = this.netBackup.validateValue(result);
    return result;
  }
}

class BpdbJobsSummaryTransform extends NetBackupLabeledTransform {
  validateRow(row) {
    if (!row.masterServer) return false;
    return row;
  }
}
class NbstlTransform extends NetBackupHeaderRowsDelimitedTransform {
  validateRow(row) {
    if (!row.useFor) return false;
    return row;
  }
}

const BpdbJobsSummary = {
  binary: "bin/admincmd/bpdbjobs",
  args: ["summary", "-l"],
  transform: BpdbJobsSummaryTransform,
  delimiter: /^(?=Summary)/,
  separator: undefined,
  table: "bpdbjobs_summary",
  fields: [
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
  ]
};

const BpdbJobsReport = {
  binary: "bin/admincmd/bpdbjobs",
  args: ["-report", "-most_columns"],
  transform: NetBackupDelimitedTransform,
  delimiter: /\r?\n/,
  separator: /,/,
  table: "bpdbjobs_report",
  fields: [
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
    { name: "masterServer", type: "string" },
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
  ]
};

const Nbstl = {
  binary: "bin/admincmd/nbstl",
  args: ["-l"],
  transform: NbstlTransform,
  delimiter: /^(?=[A-Za-z]+)/m,
  separator: /\s/,
  subSeparator: /\r?\n\s*/m,
  table: "nbstl",
  fields: [
    { name: "masterServer", type: "string", value: "masterServer" },
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
  ]
};

const BpplClients = {
  binary: "bin/admincmd/bpplclients",
  args: ["-allunique", "-l"],
  transform: NetBackupDelimitedTransform,
  delimiter: /^CLIENT /m,
  separator: /\s/,
  table: "bpplclients",
  fields: [
    { name: "masterServer", type: "string", value: "masterServer" },
    { name: "name", type: "string" },
    { name: "architecture", type: "string", update: true },
    { name: "os", type: "string", update: true },
    { name: "priority", type: "string", update: true },
    { name: "u1", type: "string" },
    { name: "u2", type: "string" },
    { name: "u3", type: "string" },
    { name: "updated", type: "datetime", value: "NOW()", update: true },
    { name: "obsoleted", type: "datetime", value: null, update: true }
  ]
};

const BpplList = {
  binary: "bin/admincmd/bppllist",
  args: ["-allpolicies"],
  transform: NetBackupLabeledTransform,
  delimiter: /^(?=CLASS)/m,
  separator: /\s/,
  table: "bppllist_policies",
  fields: [
    { name: "class", type: "string", pattern: /^CLASS (.+)/m },
    { name: "info", type: "string", pattern: /^INFO (.+)/m },
    { name: "key", type: "string", pattern: /^KEY (.+)/m },
    { name: "bcmd", type: "string", pattern: /^BCMD (.+)/m },
    { name: "rcmd", type: "string", pattern: /^RCMD (.+)/m },
    { name: "res", type: "string", pattern: /^RES (.+)/m },
    { name: "pool", type: "string", pattern: /^POOL (.+)/m },
    { name: "foe", type: "string", pattern: /^FOE (.+)/m },
    { name: "shareGroup", type: "string", pattern: /^SHAREGROUP (.+)/m },
    {
      name: "dataClassification",
      type: "string",
      pattern: /^DATACLASSIFICATION (.+)/m
    },
    {
      name: "applicationDefined",
      type: "string",
      pattern: /^APPLICATIONDEFINED (.+)/m
    },
    { name: "include", type: "string", pattern: /^INCLUDE (.+)/gm },
    { name: "client", type: "string", pattern: /^CLIENT (.+)/gm },
    { name: "sched", type: "string", pattern: /^(SCHED.+)/gm }
  ]
};
const BpplListPolicies = {
  policyTable: "bppllist_policies",
  policyFields: [
    { name: "masterServer", type: "string", value: "masterServer" },
    { name: "name", type: "string" },
    { name: "internalname", type: "string" },
    { name: "options", type: "string", update: true },
    { name: "protocolversion", type: "string", update: true },
    { name: "timeZoneOffset", type: "string" },
    { name: "auditReason", type: "string" },
    { name: "policyType", type: "string" },
    { name: "followNfsMount", type: "string" },
    { name: "clientCompress", type: "string" },
    { name: "jobPriority", type: "string" },
    { name: "proxyClient", type: "string" },
    { name: "clientEncrypt", type: "string" },
    { name: "dr", type: "string" },
    { name: "maxJobsPerClient", type: "string" },
    { name: "crossMountPoints", type: "string" },
    { name: "maxFragSize", type: "string" },
    { name: "eactive", type: "string" },
    { name: "tir", type: "string" },
    { name: "blockLevelIncrementals", type: "string" },
    { name: "individualFileRestore", type: "string" },
    { name: "streaming", type: "string" },
    { name: "frozenImage", type: "string" },
    { name: "backupCopy", type: "string" },
    { name: "effectiveDate", type: "string" },
    { name: "classId", type: "string" },
    { name: "backupCopies", type: "string" },
    { name: "checkPoints", type: "string" },
    { name: "checkPintInterval", type: "string" },
    { name: "unused", type: "string" },
    { name: "instanceRecovery", type: "string" },
    { name: "offHostBackup", type: "string" },
    { name: "alternateClient", type: "string" },
    { name: "dataMover", type: "string" },
    { name: "dataMoverType", type: "string" },
    { name: "bmr", type: "string" },
    { name: "lifeCycle", type: "string" },
    { name: "granularRestore", type: "string" },
    { name: "jobSubType", type: "string" },
    { name: "vm", type: "string" },
    { name: "ignoreCsDedup", type: "string" },
    { name: "exchangeDbSource", type: "string" },
    { name: "accelerator", type: "string" },
    { name: "granularRestore1", type: "string" },
    { name: "discoveryLifeTime", type: "string" },
    { name: "fastBackup", type: "string" },
    { name: "key", type: "string" },
    { name: "res", type: "string" },
    { name: "pool", type: "string" },
    { name: "foe", type: "string" },
    { name: "shareGroup", type: "string" },
    { name: "dataClassification", type: "string" },
    { name: "hypervServer", type: "string" },
    { name: "names", type: "string" },
    { name: "bcmd", type: "string" },
    { name: "rcmd", type: "string" },
    { name: "applicationDefined", type: "string" },
    { name: "oraBkupDataFileArgs", type: "string" },
    { name: "oraBkupArchLogArgs", type: "string" },
    { name: "includes", type: "string" },
    { name: "updated", type: "datetime", value: "NOW()", update: true },
    { name: "obsoleted", type: "datetime", value: null, update: true }
  ]
};

function netBackup(path) {
  return new Promise((resolve, reject) => new NetBackup(resolve, reject, path));
}

module.exports = { netBackup };
