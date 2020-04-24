const {
  NetBackupCommand,
  NetBackupSeparatedConvert,
  NetBackupLabeledConvert,
} = require("./NetBackup");

class BpplListLabeledConvert extends NetBackupLabeledConvert {
  subConvert(name, text, values = {}) {
    const fields = this.tables.table(name).fieldDefinition;
    for (let key in values) {
      fields.find((field) => {
        if (field[key]) field[key] = values[key];
      });
    }
    const tables = { name, fields };
    const convert = new NetBackupSeparatedConvert({ separator: / /, tables });
    const result = convert.convert(text);
    return result.row[0];
  }
  convert(text) {
    const result = { row: [] };
    let row = this.parse(text);
    const src = row.bppllist;
    let table = "bppllist_policies";
    row = this.subConvert(table, [src.class, src.info].join(" "));
    this.tables.set(row, table, "key", src.key);
    this.tables.set(row, table, "bcmd", src.bcmd);
    this.tables.set(row, table, "rcmd", src.rcmd);
    this.tables.set(row, table, "res", src.res.split(" ")[0]);
    this.tables.set(row, table, "pool", src.pool.split(" ")[0]);
    this.tables.set(row, table, "foe", src.foe.split(" ")[0]);
    this.tables.set(row, table, "shareGroup", src.shareGroup);
    this.tables.set(row, table, "dataClassification", src.dataClassification);
    this.tables.set(row, table, "applicationDefined", src.applicationDefined);
    if (src.includes) {
      this.tables.set(
        row,
        table,
        "include",
        src.includes
          .split(/^INCLUDE (.+)\n?/m)
          .filter((item) => item !== "")
          .join(",")
          .trim()
      );
    }
    if (this.validate(row)) result.row.push(row);
    const policyValues = { policyName: row[table].name };
    if (src.clients) {
      table = "bppllist_clients";
      src.clients
        .split(/^CLIENT /m)
        .filter((item) => item !== "")
        .forEach((item) => {
          const row = this.subConvert(table, item, policyValues);
          if (this.validate(row)) result.row.push(row);
        });
    }
    if (src.schedules) {
      table = "bppllist_schedules";
      src.schedules
        .split(/^SCHED /m)
        .filter((item) => item !== "")
        .forEach((item) => {
          const items = item.split(/\r?\n/m);
          const row = this.subConvert(table, items.shift(), policyValues);
          items.forEach((item) => {
            const values = item.split(" ");
            const title = values.shift();
            const value = values[0];
            //            const value = values.join(" ").trim();
            switch (title) {
              case "SCHEDCALDATES":
                this.tables.set(row, table, "calDates", value);
                break;
              case "SCHEDCALENDAR":
                this.tables.set(row, table, "calRetries", value);
                break;
              case "SCHEDCALDAYOFWEEK":
                this.tables.set(row, table, "calDayOfWeek", value);
                break;
              case "SCHEDWIN":
                this.tables.set(row, table, "win_sun_start", values[0]);
                this.tables.set(row, table, "win_sun_duration", values[1]);
                this.tables.set(row, table, "win_mon_start", values[2]);
                this.tables.set(row, table, "win_mon_duration", values[3]);
                this.tables.set(row, table, "win_tue_start", values[4]);
                this.tables.set(row, table, "win_tue_duration", values[5]);
                this.tables.set(row, table, "win_wed_start", values[6]);
                this.tables.set(row, table, "win_wed_duration", values[7]);
                this.tables.set(row, table, "win_thu_start", values[8]);
                this.tables.set(row, table, "win_thu_duration", values[9]);
                this.tables.set(row, table, "win_fri_start", values[10]);
                this.tables.set(row, table, "win_fri_duration", values[11]);
                this.tables.set(row, table, "win_sat_start", values[12]);
                this.tables.set(row, table, "win_sat_duration", values[13]);
                break;
              case "SCHEDRES":
                this.tables.set(row, table, "schedRes", value);
                break;
              case "SCHEDPOOL":
                this.tables.set(row, table, "schedPool", value);
                break;
              case "SCHEDRL":
                this.tables.set(row, table, "schedRL", value);
                break;
              case "SCHEDFOE":
                this.tables.set(row, table, "schedFoe", value);
                break;
              case "SCHEDSG":
                this.tables.set(row, table, "schedSg", value);
                break;
            }
          });
          if (this.validate(row)) result.row.push(row);
        });
    }
    return result;
  }
}

class BpplList extends NetBackupCommand {
  constructor(netBackup) {
    const tables = [
      {
        name: "bppllist",
        fields: [
          { class: /^CLASS (.+)/m },
          { info: /^INFO (.+)/m },
          { key: /^KEY (.+)/m },
          { bcmd: /^BCMD (.+)/m },
          { rcmd: /^RCMD (.+)/m },
          { res: /^RES (.+)/m },
          { pool: /^POOL (.+)/m },
          { foe: /^FOE (.+)/m },
          { shareGroup: /^SHAREGROUP (.+)/m },
          { dataClassification: /^DATACLASSIFICATION (.+)/m },
          { applicationDefined: /^APPLICATIONDEFINED (.+)/m },
          { includes: /^INCLUDE .+/gm },
          { clients: /^CLIENT .+/gm },
          { schedules: /^SCHED.+ .+/gm },
        ],
      },
      {
        name: "bppllist_policies",
        fields: [
          { masterServer: netBackup.masterServer, key: true },
          { name: "string", key: true },
          { internalname: "string" },
          { options: "number" },
          { protocolversion: "number" },
          { timeZoneOffset: "number" },
          { auditReason: "string" },
          { policyType: "number" },
          { followNfsMount: "number" },
          { clientCompress: "number" },
          { jobPriority: "number" },
          { proxyClient: "string" },
          { clientEncrypt: "number" },
          { dr: "number" },
          { maxJobsPerClient: "number" },
          { crossMountPoints: "number" },
          { maxFragSize: "number" },
          { active: "number" },
          { tir: "number" },
          { blockLevelIncrementals: "number" },
          { extSecInfo: "number" },
          { individualFileRestore: "number" },
          { streaming: "number" },
          { frozenImage: "number" },
          { backupCopy: "number" },
          { effectiveDate: "number" },
          { classId: "string" },
          { backupCopies: "number" },
          { checkPoints: "number" },
          { checkPointInterval: "number" },
          { unused: "number" },
          { instantRecovery: "number" },
          { offHostBackup: "number" },
          { alternateClient: "number" },
          { dataMover: "number" },
          { dataMoverType: "number" },
          { bmr: "number" },
          { lifeCycle: "number" },
          { granularRestore: "number" },
          { jobSubType: "number" },
          { vm: "number" },
          { ignoreCsDedup: "number" },
          { exchangeDbSource: "number" },
          { generation: "number" },
          { applicationDiscovery: "number" },
          { discoveryLifeTime: "number" },
          { fastBackup: "number" },
          { optimizedBackup: "number" },
          { clientListType: "number" },
          { selectListType: "number" },
          { appConsistent: "number" },
          { key: "string" },
          { res: "string" },
          { pool: "string" },
          { foe: "string" },
          { shareGroup: "string" },
          { dataClassification: "string" },
          { hypervServer: "string" },
          { names: "string" },
          { bcmd: "string" },
          { rcmd: "string" },
          { applicationDefined: "string" },
          { oraBkupDataFileArgs: "string" },
          { oraBkupArchLogArgs: "string" },
          { include: "string" },
          { updated: netBackup.startTime },
          { obsoleted: null },
        ],
      },
      {
        name: "bppllist_clients",
        fields: [
          { masterServer: netBackup.masterServer, key: true },
          { policyName: "string", key: true },
          { name: "string", key: true },
          { architecture: "string" },
          { os: "string" },
          { field1: "number" },
          { field2: "number" },
          { field3: "number" },
          { field4: "number" },
          { updated: netBackup.startTime },
          { obsoleted: null },
        ],
      },
      {
        name: "bppllist_schedules",
        fields: [
          { masterServer: netBackup.masterServer, key: true },
          { policyName: "string", key: true },
          { name: "string", key: true },
          { backupType: "number" },
          { multiplexingCopies: "number" },
          { frequency: "number" },
          { retentionLevel: "number" },
          { reserved1: "number" },
          { reserved2: "number" },
          { reserved3: "number" },
          { alternateReadServer: "string" },
          { maxFragmentSize: "number" },
          { calendar: "number" },
          { copies: "number" },
          { foe: "number" },
          { synthetic: "number" },
          { pfiFastRecover: "number" },
          { priority: "number" },
          { storageService: "number" },
          { checksumDetection: "number" },
          { calDates: "string" },
          { calRetries: "string" },
          { calDayOfWeek: "string" },
          { win_sun_start: "number" },
          { win_sun_duration: "number" },
          { win_mon_start: "number" },
          { win_mon_duration: "number" },
          { win_tue_start: "number" },
          { win_tue_duration: "number" },
          { win_wed_start: "number" },
          { win_wed_duration: "number" },
          { win_thu_start: "number" },
          { win_thu_duration: "number" },
          { win_fri_start: "number" },
          { win_fri_duration: "number" },
          { win_sat_start: "number" },
          { win_sat_duration: "number" },
          { schedRes: "string" },
          { schedPool: "string" },
          { schedRL: "string" },
          { schedFoe: "string" },
          { schedSg: "string" },
          { updated: netBackup.startTime },
          { obsoleted: null },
        ],
      },
    ];
    const convert = new BpplListLabeledConvert({ tables });
    super(netBackup, {
      binary: "bin/admincmd/bppllist",
      args: ["-allpolicies"],
      transform: { delimiter: /^(?=CLASS)/m, expect: /^CLASS/, convert },
    });
  }
}
module.exports = { BpplList };
