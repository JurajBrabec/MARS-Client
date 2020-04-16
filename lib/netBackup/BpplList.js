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
    policy.key = this.validateValue("string", src.key);
    policy.bcmd = this.validateValue("string", src.bcmd);
    policy.rcmd = this.validateValue("string", src.rcmd);
    policy.res = this.validateValue("string", src.res.split(" ")[0]);
    policy.pool = this.validateValue("string", src.pool.split(" ")[0]);
    policy.foe = this.validateValue("string", src.foe.split(" ")[0]);
    policy.shareGroup = this.validateValue("string", src.shareGroup);
    policy.dataClassification = this.validateValue(
      "string",
      src.dataClassification
    );
    policy.applicationDefined = this.validateValue(
      "string",
      src.applicationDefined
    );
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
              "string",
              values
                .map((value) => this.validateValue("string", value))
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
                ] = values.map((value) => this.validateValue("number", value));
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
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "protocolversion",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                { fieldName: "timeZoneOffset", fieldType: "number" },
                { fieldName: "auditReason", fieldType: "string" },
                { fieldName: "policyType", fieldType: "number" },
                { fieldName: "followNfsMount", fieldType: "number" },
                { fieldName: "clientCompress", fieldType: "number" },
                { fieldName: "jobPriority", fieldType: "number" },
                { fieldName: "proxyClient", fieldType: "string" },
                { fieldName: "clientEncrypt", fieldType: "number" },
                { fieldName: "dr", fieldType: "number" },
                { fieldName: "maxJobsPerClient", fieldType: "number" },
                { fieldName: "crossMountPoints", fieldType: "number" },
                { fieldName: "maxFragSize", fieldType: "number" },
                { fieldName: "active", fieldType: "number" },
                { fieldName: "tir", fieldType: "number" },
                { fieldName: "blockLevelIncrementals", fieldType: "number" },
                { fieldName: "individualFileRestore", fieldType: "number" },
                { fieldName: "streaming", fieldType: "number" },
                { fieldName: "frozenImage", fieldType: "number" },
                { fieldName: "backupCopy", fieldType: "number" },
                { fieldName: "effectiveDate", fieldType: "number" },
                { fieldName: "classId", fieldType: "string" },
                { fieldName: "backupCopies", fieldType: "number" },
                { fieldName: "checkPoints", fieldType: "number" },
                { fieldName: "checkPointInterval", fieldType: "number" },
                { fieldName: "unused", fieldType: "number" },
                { fieldName: "instanceRecovery", fieldType: "number" },
                { fieldName: "offHostBackup", fieldType: "number" },
                { fieldName: "alternateClient", fieldType: "number" },
                { fieldName: "dataMover", fieldType: "number" },
                { fieldName: "dataMoverType", fieldType: "number" },
                { fieldName: "bmr", fieldType: "number" },
                { fieldName: "lifeCycle", fieldType: "number" },
                { fieldName: "granularRestore", fieldType: "number" },
                { fieldName: "jobSubType", fieldType: "number" },
                { fieldName: "vm", fieldType: "number" },
                { fieldName: "ignoreCsDedup", fieldType: "number" },
                { fieldName: "exchangeDbSource", fieldType: "number" },
                { fieldName: "accelerator", fieldType: "number" },
                { fieldName: "granularRestore1", fieldType: "number" },
                { fieldName: "discoveryLifeTime", fieldType: "number" },
                { fieldName: "fastBackup", fieldType: "number" },
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
                  fieldType: "number",
                  updateOnInsert: true,
                },
                { fieldName: "u1", fieldType: "number" },
                { fieldName: "u2", fieldType: "number" },
                { fieldName: "u3", fieldType: "number" },
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
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "multiplexingCopies",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "frequency",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "retentionLevel",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "reserved1",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "reserved2",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "reserved3",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "alternateReadServer",
                  fieldType: "string",
                  updateOnInsert: true,
                },
                {
                  fieldName: "maxFragmentSize",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "calendar",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "copies",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                { fieldName: "foe", fieldType: "number", updateOnInsert: true },
                {
                  fieldName: "synthetic",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "pfiFastRecover",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "priority",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "storageService",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "checksumDetection",
                  fieldType: "number",
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
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_sun_duration",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_mon_start",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_mon_duration",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_tue_start",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_tue_duration",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_wed_start",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_wed_duration",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_thu_start",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_thu_duration",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_fri_start",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_fri_duration",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_sat_start",
                  fieldType: "number",
                  updateOnInsert: true,
                },
                {
                  fieldName: "win_sat_duration",
                  fieldType: "number",
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
