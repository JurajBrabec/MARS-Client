const { ConverterParams } = require("../Converters");
const { DataDefinition } = require("../DataDefinition");
const { TransformParams } = require("../Streams");
const {
  NetBackupCommand,
  NetBackupDelimitedConverter,
  NetBackupLabeledConverter,
} = require("./NetBackup");

class BpdbJobsSummary extends NetBackupCommand {
  constructor(netBackup) {
    super(netBackup, {
      binary: "bin/admincmd/bpdbjobs",
      args: ["-summary", "-l"],
      batchSize: 1,
      transformParams: new TransformParams({
        converterType: NetBackupLabeledConverter,
        delimiter: /^(?<=Summary)/m,
        unexpected: /^Error/,
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

class BpdbJobsReport extends NetBackupCommand {
  constructor(netBackup, days = 3) {
    super(netBackup, {
      binary: "bin/admincmd/bpdbjobs",
      args: ["-report", "-most_columns", "-t", netBackup.timeStamp(-days)],
      batchSize: 2048,
      transformParams: new TransformParams({
        converterType: NetBackupDelimitedConverter,
        unexpected: /^Error/,
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
              //              { fieldName: "queuereason", fieldType: "number" },
              { fieldName: "reasonstring", fieldType: "string" },
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
module.exports = { BpdbJobsSummary, BpdbJobsReport };
