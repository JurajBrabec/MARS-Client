const { ConverterParams } = require("../Converters");
const { DataDefinition } = require("../DataDefinition");
const { TransformParams } = require("../Streams");
const {
  NetBackupCommand,
  NetBackupDelimitedConverter,
  NetBackupLabeledConverter,
} = require("./NetBackup");

class BpplListLabeledConverter extends NetBackupLabeledConverter {
  subConvert(tableIndex, text) {
    let definition = new DataDefinition(
      JSON.parse(JSON.stringify(this.params.dataDefinition.tables[tableIndex]))
    );
    let converter = new NetBackupDelimitedConverter(
      new ConverterParams(definition, / /)
    );
    return converter.convert(text);
  }
  convert(text) {
    let result = { row: [] };
    if (!this.params || this.params.dataDefinition.length == 0) return result;
    let row = this.parse(text);
    const src = { ...row.bppllist };
    row = {};
    let subResult = this.subConvert(1, [src.class, src.info].join(" "));
    const policy = subResult.row[0].bppllist_policies;
    policy.key = this.validateValue(src.key);
    policy.bcmd = this.validateValue(src.bcmd);
    policy.rcmd = this.validateValue(src.rcmd);
    policy.res = this.validateValue(src.res.split(" ")[0]);
    policy.pool = this.validateValue(src.pool.split(" ")[0]);
    policy.foe = this.validateValue(src.foe.split(" ")[0]);
    policy.shareGroup = this.validateValue(src.shareGroup);
    policy.dataClassification = this.validateValue(src.dataClassification);
    policy.applicationDefined = this.validateValue(src.applicationDefined);
    if (src.includes) {
      policy.includes = src.includes
        .split(/^INCLUDE (.+)\n?/m)
        .filter((item) => item !== "")
        .join(",")
        .trim();
    }
    row.bppllist_policies = policy;
    if (this.validateRow(row)) result.row.push(row);
    this.params.dataDefinition.tables[2].fields[1].fixedValue = policy.name;
    this.params.dataDefinition.tables[3].fields[1].fixedValue = policy.name;
    if (src.clients) {
      src.clients
        .split(/^CLIENT /m)
        .filter((item) => item !== "")
        .forEach((item) => {
          subResult = this.subConvert(2, item);
          row = {};
          row.bppllist_clients = subResult.row[0].bppllist_clients;
          if (this.validateRow(row)) result.row.push(row);
        });
    }
    if (src.schedules) {
      src.schedules
        .split(/^SCHED /m)
        .filter((item) => item !== "")
        .forEach((item) => {
          const items = item.split(/\r?\n/m);
          subResult = this.subConvert(3, items.shift());
          row = {};
          const schedule = subResult.row[0].bppllist_schedules;
          items.forEach((item) => {
            const values = item.split(" ");
            const title = values.shift();
            const joinedValues = this.validateValue(
              values
                .map((value) => this.validateValue(value))
                .join(" ")
                .trim()
            );
            switch (title) {
              case "SCHEDCALDATES":
                schedule.calDates = joinedValues;
                break;
              case "SCHEDCALENDAR":
                schedule.calRetries = joinedValues;
                break;
              case "SCHEDCALDAYOFWEEK":
                schedule.calDayOfWeek = joinedValues;
                break;
              case "SCHEDWIN":
                [
                  schedule.win_sun_start,
                  schedule.win_sun_duration,
                  schedule.win_mon_start,
                  schedule.win_mon_duration,
                  schedule.win_tue_start,
                  schedule.win_tue_duration,
                  schedule.win_wed_start,
                  schedule.win_wed_duration,
                  schedule.win_thu_start,
                  schedule.win_thu_duration,
                  schedule.win_fri_start,
                  schedule.win_fri_duration,
                  schedule.win_sat_start,
                  schedule.win_sat_duration,
                ] = values;
                break;
              case "SCHEDRES":
                schedule.schedRes = joinedValues;
                break;
              case "SCHEDPOOL":
                schedule.schedPool = joinedValues;
                break;
              case "SCHEDRL":
                schedule.schedRL = joinedValues;
                break;
              case "SCHEDFOE":
                schedule.schedFoe = joinedValues;
                break;
              case "SCHEDSG":
                schedule.schedSg = joinedValues;
                break;
            }
          });
          row.bppllist_schedules = schedule;
          if (this.validateRow(row)) result.row.push(row);
        });
    }
    return result;
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
        delimiter: /^(?<=CLASS)/m,
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
                  fieldName: "includes",
                  fieldType: "string",
                  regExp: /^INCLUDE .+/gm,
                },
                {
                  fieldName: "clients",
                  fieldType: "string",
                  regExp: /^CLIENT .+/gm,
                },
                {
                  fieldName: "schedules",
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
                  updateOnInsert: true,
                },
                {
                  fieldName: "protocolversion",
                  fieldType: "string",
                  updateOnInsert: true,
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
                { fieldName: "active", fieldType: "string" },
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
                { fieldName: "checkPointInterval", fieldType: "string" },
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
                  updateOnInsert: true,
                },
                {
                  fieldName: "obsoleted",
                  fieldType: "datetime",
                  fixedValue: null,
                  updateOnInsert: true,
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
                  fieldName: "backupType",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "multiplexingCopies",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "frequency",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "retentionLevel",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "reserved1",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "reserved2",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "reserved3",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "alternateReadServer",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "maxFragmentSize",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "calendar",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "copies",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                { fieldName: "foe", fieldType: "string", updateOnInsert: true },
                {
                  fieldName: "synthetic",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "pfiFastRecover",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "priority",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "storageService",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "checksumDetection",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "calDates",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "calRetries",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "calDayOfWeek",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_sun_start",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_sun_duration",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_mon_start",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_mon_duration",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_tue_start",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_tue_duration",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_wed_start",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_wed_duration",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_thu_start",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_thu_duration",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_fri_start",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_fri_duration",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_sat_start",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_sat_duration",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "schedRes",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "schedPool",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "schedRL",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "schedFoe",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "schedSg",
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
            },
          ]),
        }),
      }),
    });
  }
}
module.exports = { BpplList };
