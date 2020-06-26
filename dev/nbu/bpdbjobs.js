const path = require("path");

class Summary {
  constructor(nbu) {
    this.process = {
      args: ["-summary", "-l"],
      file: path.join(nbu.bin, "admincmd", "bpdbjobs.exe"),
    };
    this.parser = [
      { split: /(\r?\n){2}/ },
      { filter: "" },
      { expect: /^Summary/ },
      { split: /\r?\n/ },
      { replace: ["on", ":"] },
      { separate: ":" },
      { shift: 1 },
      { expect: 10 },
    ];
    this.tables = {
      bpdbjobs_summary: [
        { masterServer: "string", key: true },
        { queued: "number" },
        { waiting: "number" },
        { active: "number" },
        { successful: "number" },
        { partial: "number" },
        { failed: "number" },
        { incomplete: "number" },
        { suspended: "number" },
        { total: "number" },
      ],
    };
  }
}

class Jobs {
  constructor(nbu) {
    this.process = {
      args: ["-report", "-most_columns"],
      file: path.join(nbu.bin, "admincmd", "bpdbjobs.exe"),
    };
    this.parser = [
      { expect: /^\d+/ },
      { split: /\r?\n/m },
      { separate: "," },
      { expect: 64 },
    ];
    this.tables = {
      bpdbjobs_report: [
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
  }
}

class JobsAll extends Jobs {}
class JobsDaysBack extends Jobs {
  constructor(nbu, daysBack) {
    super(nbu);
    this.process.args.push("-t", nbu.dateDiff(-daysBack));
  }
}
class JobId extends Jobs {
  constructor(nbu, backupId) {
    super(nbu);
    this.process.args.push("-jobId", backupId);
  }
}

module.exports = { Jobs, JobsAll, JobsDaysBack, JobId, Summary };
