const dotenv = require("dotenv").config();
const path = require("path");
const nbu = require("./nbu");

const _summary = {
  process: {
    args: ["-summary", "-l"],
    file: path.join(process.env.NBU_BIN, "admincmd", "bpdbjobs.exe"),
  },
  parser: [
    { split: /(\r?\n){2}/ },
    { filter: "" },
    { expect: /^Summary/ },
    { split: /\r?\n/ },
    { replace: ["on", ":"] },
    { separate: ":" },
    { shift: 1 },
    { expect: 10 },
  ],
  tables: {
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
  },
};

const _jobs = {
  process: {
    args: ["-report", "-most_columns"],
    file: path.join(process.env.NBU_BIN, "admincmd", "bpdbjobs.exe"),
  },
  parser: [
    { expect: /^\d+/ },
    { split: /\r?\n/m },
    { separate: "," },
    { expect: 64 },
  ],
  tables: {
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
  },
};

jobsAll = () => new nbu.Stream({ command: _jobs });

function jobsDaysBack(daysBack) {
  const command = { ..._jobs };
  command.process.args.push("-t", nbu.dateDiff(-daysBack));
  return new nbu.Stream({ command });
}
function jobsBackupId(backupId) {
  const command = { ..._jobs };
  command.process.args.push("-jobid", backupId);
  return new nbu.Stream({ command });
}
summary = () => new nbu.Emitter({ command: _summary });

module.exports = { jobsAll, jobsBackupId, jobsDaysBack, summary };
