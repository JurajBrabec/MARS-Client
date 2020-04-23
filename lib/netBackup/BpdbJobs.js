const {
  NetBackupCommand,
  NetBackupSeparatedConvert,
  NetBackupLabeledConvert,
} = require("./NetBackup");

class BpdbJobsSummary extends NetBackupCommand {
  constructor(netBackup) {
    const tables = {
      name: "bpdbjobs_summary",
      fields: [
        { masterServer: /^Summary of jobs on (\S+)/m, key: true },
        { queued: /^Queued:\s+(\d+)/m },
        { waiting: /^Waiting-to-Retry:\s+(\d+)/m },
        { active: /^Active:\s+(\d+)/m },
        { successful: /^Successful:\s+(\d+)/m },
        { partial: /^Partially Successful:\s+(\d+)/m },
        { failed: /^Failed:\s+(\d+)/m },
        { incomplete: /^Incomplete:\s+(\d+)/m },
        { suspended: /^Suspended:\s+(\d+)/m },
        { total: /^Total:\s+(\d+)/m },
      ],
    };
    const convert = new NetBackupLabeledConvert({ tables });
    super(netBackup, {
      binary: "bin/admincmd/bpdbjobs",
      args: ["-summary", "-l"],
      transform: { delimiter: /^(?<=Summary)/m, expect: /^Summary/, convert },
    });
  }
}

class BpdbJobsReport extends NetBackupCommand {
  constructor(netBackup, days = 1) {
    const tables = {
      name: "bpdbjobs_report",
      fields: [
        { jobId: "number", key: true },
        { jobType: "number" },
        { state: "number" },
        { status: "number" },
        { policy: "string" },
        { schedule: "string" },
        { client: "string" },
        { server: "string" },
        { started: "number" },
        { elapsed: "number" },
        { ended: "number" },
        { stunit: "string" },
        { tries: "number" },
        { operation: "string" },
        { kbytes: "number" },
        { files: "number" },
        { pathlastwritten: "string" },
        { percent: "number" },
        { jobpid: "number" },
        { owner: "string" },
        { subtype: "number" },
        { policytype: "number" },
        { scheduletype: "number" },
        { priority: "number" },
        { group: "string" },
        { masterServer: "string" },
        { retentionlevel: "number" },
        { retentionperiod: "number" },
        { compression: "number" },
        { kbytestobewritten: "number" },
        { filestobewritten: "number" },
        { filelistcount: "number" },
        { trycount: "number" },
        { parentjob: "number" },
        { kbpersec: "number" },
        { copy: "number" },
        { robot: "string" },
        { vault: "string" },
        { profile: "string" },
        { session: "string" },
        { ejecttapes: "string" },
        { srcstunit: "string" },
        { srcserver: "string" },
        { srcmedia: "string" },
        { dstmedia: "string" },
        { stream: "number" },
        { suspendable: "number" },
        { resumable: "number" },
        { restartable: "number" },
        { datamovement: "number" },
        { snapshot: "number" },
        { backupid: "string" },
        { killable: "number" },
        { controllinghost: "number" },
        { offhosttype: "number" },
        { ftusage: "number" },
        //        { queuereason: "number" },
        { reasonstring: "string" },
        { dedupratio: "float" },
        { accelerator: "number" },
        { instancedbname: "string" },
        { rest1: "string" },
        { rest2: "string" },
      ],
    };
    const convert = new NetBackupSeparatedConvert({ separator: /,/, tables });
    super(netBackup, {
      binary: "bin/admincmd/bpdbjobs",
      args: ["-report", "-most_columns", "-t", netBackup.timeStamp(-days)],
      transform: { delimiter: /\r?\n/m, expect: /^\d+/, convert },
    });
  }
}
module.exports = { BpdbJobsSummary, BpdbJobsReport };
