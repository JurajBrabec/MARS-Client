const dotenv = require("dotenv").config();

const { DataDefinition } = require("./DataDefinition");
const {
  ConverterParams,
  LabeledConverter,
  DelimitedConverter,
  HeaderRowsDelimitedConverter,
} = require("./Converters");
const { TransformParams } = require("./Streams");
const { Command, CommandReadable } = require("./Commands");

class NetBackupLabeledConverter extends LabeledConverter {
  validateValue(value) {
    let result = super.validateValue(value);
    if (nbu) result = nbu.validateValue(result);
    return result;
  }
}

class NetBackupDelimitedConverter extends DelimitedConverter {
  validateValue(value) {
    let result = super.validateValue(value);
    if (nbu) result = nbu.validateValue(result);
    return result;
  }
}

class NetBackupHeaderRowsDelimitedConverter extends HeaderRowsDelimitedConverter {
  validateValue(value) {
    let result = super.validateValue(value);
    if (nbu) result = nbu.validateValue(result);
    return result;
  }
}

class BpplListLabeledConverter extends NetBackupLabeledConverter {
  convert(text) {
    let result = { row: [] };
    if (!this.params || this.params.dataDefinition.length == 0) return result;
    let row = this.parse(text);
    let src = { ...row.bppllist };
    let policy = { ...row.bppllist_policies };
    let client = { ...row.bppllist_clients };
    let schedule = { ...row.bppllist_schedules };
    delete row.bppllist;
    delete row.bppllist_clients;
    delete row.bppllist_schedules;

    let [name] = src.class.split(" ");
    policy.name = this.validateValue(name);
    let [policyType] = src.info.split(" ");
    policy.policyType = this.validateValue(policyType);
    policy.key = this.validateValue(src.key);
    policy.bcmd = this.validateValue(src.bcmd);
    policy.rcmd = this.validateValue(src.rcmd);
    policy.res = this.validateValue(src.res.split(" ")[0]);
    policy.pool = this.validateValue(src.pool.split(" ")[0]);
    policy.foe = this.validateValue(src.foe.split(" ")[0]);
    policy.shareGroup = this.validateValue(src.shareGroup);
    policy.dataClassification = this.validateValue(src.dataClassification);
    policy.applicationDefined = this.validateValue(src.applicationDefined);
    policy.includes = src.include;
    row.bppllist_policies = policy;
    if (this.validateRow(row)) result.row.push(row);

    row = {};
    client.policyName = policy.name;
    row.bppllist_clients = client;
    if (this.validateRow(row)) result.row.push(row);
    if (this.validateRow(row)) result.row.push(row);

    row = {};
    schedule.policyName = policy.name;
    row.bppllist_schedules = schedule;
    if (this.validateRow(row)) result.row.push(row);
    if (this.validateRow(row)) result.row.push(row);
    return result;
  }
}

class NetBackup extends Command {
  constructor(path, pool) {
    super();
    this.params = { path, pool };
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
    if (this.masterServer) this.successEnd(this);
    try {
      const obj = await this.summary().asObjects();
      this.masterServer = obj[0].bpdbjobs_summary.masterServer;
      this.successEnd(this);
    } catch (err) {
      this.masterServer = null;
      this.throwError(err);
    }
  }
  validateValue(value) {
    let result;
    switch (value) {
      case "":
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
    return new Date().toISOString().slice(0, 19).replace("T", " ");
  }
  summary() {
    return new BpdbjobsSummary(this);
  }

  jobs() {
    return new BpdbjobsReport(this);
  }
  slps() {
    return new Nbstl(this);
  }
  clients() {
    return new BpplClients(this);
  }
  policies() {
    return new BpplList(this);
  }
}

class NetBackupCommand extends CommandReadable {
  constructor(netBackup, params) {
    super({
      path: netBackup.params.path,
      binary: params.binary,
      args: params.args,
      transformParams: params.transformParams,
    });
    this.netBackup = netBackup;
    this.params.batchSize = params.batchSize;
  }
  get masterServer() {
    return this.netBackup._masterServer;
  }
  set masterServer(name) {
    this.netBackup._masterServer = name;
  }
  toDatabase() {
    return super.toDatabase(this.netBackup.params.pool, this.params.batchSize);
  }
}
class BpdbjobsSummary extends NetBackupCommand {
  constructor(netBackup) {
    super(netBackup, {
      binary: "bin/admincmd/bpdbjobs",
      args: ["-summary", "-l"],
      batchSize: 1,
      transformParams: new TransformParams({
        converterType: NetBackupLabeledConverter,
        delimiter: /^(?=Summary)/m,
        converterParams: new ConverterParams(
          new DataDefinition({
            tableName: "bpdbjobs_summary",
            fields: [
              {
                fieldName: "masterServer",
                fieldType: "string",
                regExp: /^Summary of jobs on (\S+)/m,
              },
              {
                fieldName: "queued",
                fieldType: "number",
                regExp: /^Queued:\s+(\d+)/m,
                updateOnInsert: true,
              },
              {
                fieldName: "waiting",
                fieldType: "number",
                regExp: /^Waiting-to-Retry:\s+(\d+)/m,
                updateOnInsert: true,
              },
              {
                fieldName: "active",
                fieldType: "number",
                regExp: /^Active:\s+(\d+)/m,
                updateOnInsert: true,
              },
              {
                fieldName: "successful",
                fieldType: "number",
                regExp: /^Successful:\s+(\d+)/m,
                updateOnInsert: true,
              },
              {
                fieldName: "partial",
                fieldType: "number",
                regExp: /^Partially Successful:\s+(\d+)/m,
                updateOnInsert: true,
              },
              {
                fieldName: "failed",
                fieldType: "number",
                regExp: /^Failed:\s+(\d+)/m,
                updateOnInsert: true,
              },
              {
                fieldName: "incomplete",
                fieldType: "number",
                regExp: /^Incomplete:\s+(\d+)/m,
                updateOnInsert: true,
              },
              {
                fieldName: "suspended",
                fieldType: "number",
                regExp: /^Suspended:\s+(\d+)/m,
                updateOnInsert: true,
              },
              {
                fieldName: "total",
                fieldType: "number",
                regExp: /^Total:\s+(\d+)/m,
                updateOnInsert: true,
              },
            ],
          })
        ),
      }),
    });
  }
}

class BpdbjobsReport extends NetBackupCommand {
  constructor(netBackup) {
    super(netBackup, {
      binary: "bin/admincmd/bpdbjobs",
      args: ["-report", "-most_columns"],
      batchSize: 1024,
      transformParams: new TransformParams({
        converterType: NetBackupDelimitedConverter,
        converterParams: new ConverterParams({
          dataDefinition: new DataDefinition({
            tableName: "bpdbjobs_report",
            fields: [
              { fieldName: "jobId", fieldType: "number" },
              { fieldName: "jobType", fieldType: "number" },
              { fieldName: "state", fieldType: "number", updateOnInsert: true },
              {
                fieldName: "status",
                fieldType: "number",
                updateOnInsert: true,
              },
              { fieldName: "policy", fieldType: "string" },
              { fieldName: "schedule", fieldType: "string" },
              { fieldName: "client", fieldType: "string" },
              { fieldName: "server", fieldType: "string" },
              { fieldName: "started", fieldType: "number" },
              {
                fieldName: "elapsed",
                fieldType: "number",
                updateOnInsert: true,
              },
              { fieldName: "ended", fieldType: "number", updateOnInsert: true },
              { fieldName: "stunit", fieldType: "string" },
              { fieldName: "tries", fieldType: "number", updateOnInsert: true },
              { fieldName: "operation", fieldType: "string" },
              {
                fieldName: "kbytes",
                fieldType: "number",
                updateOnInsert: true,
              },
              { fieldName: "files", fieldType: "number", updateOnInsert: true },
              {
                fieldName: "pathlastwritten",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "percent",
                fieldType: "number",
                updateOnInsert: true,
              },
              { fieldName: "jobpid", fieldType: "number" },
              { fieldName: "owner", fieldType: "string" },
              { fieldName: "subtype", fieldType: "number" },
              { fieldName: "policytype", fieldType: "number" },
              { fieldName: "scheduletype", fieldType: "number" },
              { fieldName: "priority", fieldType: "number" },
              { fieldName: "group", fieldType: "string" },
              { fieldName: "masterServer", fieldType: "string" },
              { fieldName: "retentionlevel", fieldType: "number" },
              { fieldName: "retentionperiod", fieldType: "number" },
              { fieldName: "compression", fieldType: "number" },
              {
                fieldName: "kbytestobewritten",
                fieldType: "number",
                updateOnInsert: true,
              },
              {
                fieldName: "filestobewritten",
                fieldType: "number",
                updateOnInsert: true,
              },
              {
                fieldName: "filelistcount",
                fieldType: "number",
                updateOnInsert: true,
              },
              {
                fieldName: "trycount",
                fieldType: "number",
                updateOnInsert: true,
              },
              { fieldName: "parentjob", fieldType: "number" },
              {
                fieldName: "kbpersec",
                fieldType: "number",
                updateOnInsert: true,
              },
              { fieldName: "copy", fieldType: "number", updateOnInsert: true },
              { fieldName: "robot", fieldType: "string" },
              { fieldName: "vault", fieldType: "string" },
              { fieldName: "profile", fieldType: "string" },
              { fieldName: "session", fieldType: "string" },
              { fieldName: "ejecttapes", fieldType: "string" },
              { fieldName: "srcstunit", fieldType: "string" },
              { fieldName: "srcserver", fieldType: "string" },
              { fieldName: "srcmedia", fieldType: "string" },
              { fieldName: "dstmedia", fieldType: "string" },
              { fieldName: "stream", fieldType: "number" },
              { fieldName: "suspendable", fieldType: "number" },
              { fieldName: "resumable", fieldType: "number" },
              { fieldName: "restartable", fieldType: "number" },
              { fieldName: "datamovement", fieldType: "number" },
              { fieldName: "snapshot", fieldType: "number" },
              { fieldName: "backupid", fieldType: "string" },
              { fieldName: "killable", fieldType: "number" },
              { fieldName: "controllinghost", fieldType: "number" },
              { fieldName: "offhosttype", fieldType: "number" },
              { fieldName: "ftusage", fieldType: "number" },
              { fieldName: "reasonstring", fieldType: "number" },
              {
                fieldName: "dedupratio",
                fieldType: "number",
                updateOnInsert: true,
              },
              { fieldName: "accelerator", fieldType: "number" },
              { fieldName: "instancedbname", fieldType: "string" },
              { fieldName: "rest1", fieldType: "string" },
              { fieldName: "rest2", fieldType: "string" },
            ],
          }),
        }),
      }),
    });
  }
}

class Nbstl extends NetBackupCommand {
  constructor(netBackup) {
    super(netBackup, {
      binary: "bin/admincmd/nbstl",
      args: ["-l"],
      batchSize: 256,
      transformParams: new TransformParams({
        converterType: NetBackupHeaderRowsDelimitedConverter,
        delimiter: /^(?=[A-Za-z]+)/m,
        converterParams: new ConverterParams({
          separator: /\s/,
          subSeparator: /\r?\n\s*/,
          dataDefinition: new DataDefinition({
            tableName: "nbstl",
            fields: [
              {
                fieldName: "masterServer",
                fieldType: "string",
                fixedValue: netBackup.masterServer,
              },
              { fieldName: "slpName", fieldType: "string" },
              {
                fieldName: "dataClassification",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "duplicationPriority",
                fieldType: "string",
                updateOnInsert: true,
              },
              { fieldName: "state", fieldType: "string", updateOnInsert: true },
              {
                fieldName: "version",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "useFor",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "storageUnit",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "volumePool",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "mediaOwner",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "retentionType",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "retentionLevel",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "alternateReadServer",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "preserveMpx",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "ddoState",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "source",
                fieldType: "string",
                updateOnInsert: true,
              },
              { fieldName: "unused", fieldType: "string, updateOnInsert:true" },
              {
                fieldName: "operationId",
                fieldType: "string",
                updateOnInsert: true,
              },
              { fieldName: "operationIndex", fieldType: "string" },
              {
                fieldName: "slpWindow",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "targetMaster",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "targetMasterSlp",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "updated",
                fieldType: "datetime",
                fixedValue: netBackup.now(),
                updateOnInsert: true,
              },
              {
                fieldName: "obsoleted",
                fieldType: "datetime",
                fixedValue: null,
                updateOnInsert: true,
              },
            ],
          }),
        }),
      }),
    });
  }
}

class BpplClients extends NetBackupCommand {
  constructor(netBackup) {
    super(netBackup, {
      binary: "bin/admincmd/bpplclients",
      args: ["-allunique", "-l"],
      batchSize: 1024,
      transformParams: new TransformParams({
        converterType: NetBackupDelimitedConverter,
        delimiter: /^CLIENT /m,
        converterParams: new ConverterParams({
          separator: /\s/,
          dataDefinition: new DataDefinition({
            tableName: "bpplpclients",
            fields: [
              {
                fieldName: "masterServer",
                fieldType: "string",
                fixedValue: netBackup.masterServer,
              },
              { fieldName: "name", fieldType: "string" },
              {
                fieldName: "architecture",
                fieldType: "string",
                updateOnInsert: true,
              },
              { fieldName: "os", fieldType: "string", updateOnInsert: true },
              {
                fieldName: "priority",
                fieldType: "string",
                updateOnInsert: true,
              },
              { fieldName: "u1", fieldType: "string" },
              { fieldName: "u2", fieldType: "string" },
              { fieldName: "u3", fieldType: "string" },
              {
                fieldName: "updated",
                fieldType: "datetime",
                fixedValue: netBackup.now(),
                updateOnInsert: true,
              },
              {
                fieldName: "obsoleted",
                fieldType: "datetime",
                fixedValue: null,
                updateOnInsert: true,
              },
            ],
          }),
        }),
      }),
    });
  }
}

class BpplList extends NetBackupCommand {
  constructor(netBackup) {
    super(netBackup, {
      binary: "bin/admincmd/bppllist",
      args: ["-allpolicies"],
      batchSize: 1024,
      transformParams: new TransformParams({
        converterType: BpplListLabeledConverter,
        delimiter: /^(?=CLASS)/m,
        converterParams: new ConverterParams({
          dataDefinition: new DataDefinition([
            {
              tableName: "bppllist",
              fields: [
                {
                  fieldName: "class",
                  fieldType: "string",
                  regExp: /^CLASS (.+)/m,
                },
                {
                  fieldName: "info",
                  fieldType: "string",
                  regExp: /^INFO (.+)/m,
                },
                { fieldName: "key", fieldType: "string", regExp: /^KEY (.+)/m },
                {
                  fieldName: "bcmd",
                  fieldType: "string",
                  regExp: /^BCMD (.+)/m,
                },
                {
                  fieldName: "rcmd",
                  fieldType: "string",
                  regExp: /^RCMD (.+)/m,
                },
                { fieldName: "res", fieldType: "string", regExp: /^RES (.+)/m },
                {
                  fieldName: "pool",
                  fieldType: "string",
                  regExp: /^POOL (.+)/m,
                },
                { fieldName: "foe", fieldType: "string", regExp: /^FOE (.+)/m },
                {
                  fieldName: "shareGroup",
                  fieldType: "string",
                  regExp: /^SHAREGROUP (.+)/m,
                },
                {
                  fieldName: "dataClassification",
                  fieldType: "string",
                  regExp: /^DATACLASSIFICATION (.+)/m,
                },
                {
                  fieldName: "applicationDefined",
                  fieldType: "string",
                  regExp: /^APPLICATIONDEFINED (.+)/m,
                },
                {
                  fieldName: "include",
                  fieldType: "string",
                  regExp: /^INCLUDE .+/gm,
                },
                {
                  fieldName: "client",
                  fieldType: "string",
                  regExp: /^CLIENT .+/gm,
                },
                {
                  fieldName: "sched",
                  fieldType: "string",
                  regExp: /^SCHED.+ .+/gm,
                },
              ],
            },
            {
              tableName: "bppllist_policies",
              fields: [
                {
                  fieldName: "masterServer",
                  fieldType: "string",
                  fixedValue: netBackup.masterServer,
                },
                { fieldName: "name", fieldType: "string" },
                { fieldName: "internalname", fieldType: "string" },
                {
                  fieldName: "options",
                  fieldType: "string",
                  updateonInsert: true,
                },
                {
                  fieldName: "protocolversion",
                  fieldType: "string",
                  updateonInsert: true,
                },
                { fieldName: "timeZoneOffset", fieldType: "string" },
                { fieldName: "auditReason", fieldType: "string" },
                { fieldName: "policyType", fieldType: "string" },
                { fieldName: "followNfsMount", fieldType: "string" },
                { fieldName: "clientCompress", fieldType: "string" },
                { fieldName: "jobPriority", fieldType: "string" },
                { fieldName: "proxyClient", fieldType: "string" },
                { fieldName: "clientEncrypt", fieldType: "string" },
                { fieldName: "dr", fieldType: "string" },
                { fieldName: "maxJobsPerClient", fieldType: "string" },
                { fieldName: "crossMountPoints", fieldType: "string" },
                { fieldName: "maxFragSize", fieldType: "string" },
                { fieldName: "eactive", fieldType: "string" },
                { fieldName: "tir", fieldType: "string" },
                { fieldName: "blockLevelIncrementals", fieldType: "string" },
                { fieldName: "individualFileRestore", fieldType: "string" },
                { fieldName: "streaming", fieldType: "string" },
                { fieldName: "frozenImage", fieldType: "string" },
                { fieldName: "backupCopy", fieldType: "string" },
                { fieldName: "effectiveDate", fieldType: "string" },
                { fieldName: "classId", fieldType: "string" },
                { fieldName: "backupCopies", fieldType: "string" },
                { fieldName: "checkPoints", fieldType: "string" },
                { fieldName: "checkPintInterval", fieldType: "string" },
                { fieldName: "unused", fieldType: "string" },
                { fieldName: "instanceRecovery", fieldType: "string" },
                { fieldName: "offHostBackup", fieldType: "string" },
                { fieldName: "alternateClient", fieldType: "string" },
                { fieldName: "dataMover", fieldType: "string" },
                { fieldName: "dataMoverType", fieldType: "string" },
                { fieldName: "bmr", fieldType: "string" },
                { fieldName: "lifeCycle", fieldType: "string" },
                { fieldName: "granularRestore", fieldType: "string" },
                { fieldName: "jobSubType", fieldType: "string" },
                { fieldName: "vm", fieldType: "string" },
                { fieldName: "ignoreCsDedup", fieldType: "string" },
                { fieldName: "exchangeDbSource", fieldType: "string" },
                { fieldName: "accelerator", fieldType: "string" },
                { fieldName: "granularRestore1", fieldType: "string" },
                { fieldName: "discoveryLifeTime", fieldType: "string" },
                { fieldName: "fastBackup", fieldType: "string" },
                { fieldName: "key", fieldType: "string" },
                { fieldName: "res", fieldType: "string" },
                { fieldName: "pool", fieldType: "string" },
                { fieldName: "foe", fieldType: "string" },
                { fieldName: "shareGroup", fieldType: "string" },
                { fieldName: "dataClassification", fieldType: "string" },
                { fieldName: "hypervServer", fieldType: "string" },
                { fieldName: "names", fieldType: "string" },
                { fieldName: "bcmd", fieldType: "string" },
                { fieldName: "rcmd", fieldType: "string" },
                { fieldName: "applicationDefined", fieldType: "string" },
                { fieldName: "oraBkupDataFileArgs", fieldType: "string" },
                { fieldName: "oraBkupArchLogArgs", fieldType: "string" },
                { fieldName: "includes", fieldType: "string" },
                {
                  fieldName: "updated",
                  fieldType: "datetime",
                  fixedValue: netBackup.now(),
                  updateonInsert: true,
                },
                {
                  fieldName: "obsoleted",
                  fieldType: "datetime",
                  fixedValue: null,
                  updateonInsert: true,
                },
              ],
            },
            {
              tableName: "bppllist_clients",
              fields: [
                {
                  fieldName: "masterServer",
                  fieldType: "string",
                  fixedValue: netBackup.masterServer,
                },
                { fieldName: "policyName", fieldType: "string" },
                { fieldName: "name", fieldType: "string" },
                {
                  fieldName: "updated",
                  fieldType: "datetime",
                  fixedValue: netBackup.now(),
                  updateonInsert: true,
                },
                {
                  fieldName: "obsoleted",
                  fieldType: "datetime",
                  fixedValue: null,
                  updateonInsert: true,
                },
              ],
            },
            {
              tableName: "bppllist_schedules",
              fields: [
                {
                  fieldName: "masterServer",
                  fieldType: "string",
                  fixedValue: netBackup.masterServer,
                },
                { fieldName: "policyName", fieldType: "string" },
                { fieldName: "name", fieldType: "string" },
                {
                  fieldName: "updated",
                  fieldType: "datetime",
                  fixedValue: netBackup.now(),
                  updateonInsert: true,
                },
                {
                  fieldName: "obsoleted",
                  fieldType: "datetime",
                  fixedValue: null,
                  updateonInsert: true,
                },
              ],
            },
          ]),
        }),
      }),
    });
  }
}

var nbu = nbu || new NetBackup(process.env.NBU_HOME);
module.exports = { nbu };
