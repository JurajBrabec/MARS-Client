const cli = require("pixl-cli");
const debug = require("debug");
const fs = require("fs");
const moment = require("moment");
const { Command } = require("../Command");

class Nbu2Sm9 extends Command {
  constructor(netBackup) {
    super();
    this.netBackup = netBackup;
    this.fileName = "mars_mon.log";
    this.path = process.env.NBU2SM9_PATH;
    this.title = "Writing tickets";
    this.line = `<DATE>::<SEVERITY>::<ERRORCODE>::<MESSAGETEXT>::<EVENTNODE>::<EVENTTYPEINSTANCE>::<CORELLATIONKEY>`;
    this.messageText = `<POLICYTYPE> <JOBTYPE> policy "<POLICY>" <STATUSTEXT>. <STATE> with JobID:<JOBID> schedule "<SCHEDULE>" client <CLIENT> status <ERRORCODE> (<ERRORTEXT>)`;
    this.filterJobTypes = process.env.NBU2SM9_FILTER_JOBTYPES || "none";
    this.filterPolicyTypes = process.env.NBU2SM9_FILTER_POLICYTYPES || "none";
    this.filterPolicies = process.env.NBU2SM9_FILTER_POLICIES || "none";
    this.filterStatuses = process.env.NBU2SM9_FILTER_STATUSES || "none";
    this.dbg = debug("nbu2sm9");
  }
  onError = (error) => {
    this.status.error = error;
    this.throwError(error);
  };
  onResult = (result) => {
    this.status.commands = 1;
    this.status.rows = result.rows;
    this.status.duration = result.duration;
    this.status.sqlDuration = result.duration;
    this.status.sqls = result.sqls;
    this.status.warnings = result.warnings;
    this.status.errors = result.errors;
    if (result.errors) this.status.messages = result.messages;
    result = this.status;
    this.successEnd(result);
  };
  async toDatabase(database) {
    const startTime = this.netBackup.startTime;
    let result;
    try {
      if (!fs.existsSync(this.path)) {
        fs.mkdirSync(this.path);
      }
      const fileName = this.path + "/" + this.fileName;
      let lastFailure = { jobId: 0, ended: moment().subtract(1, "hour") };
      if (fs.existsSync(fileName)) {
        const contents = fs.readFileSync(fileName, "utf8");
        const [lastLine] = contents.trim().split("\n").slice(-1);
        const match = lastLine.match(/^(.+?)::.+JobID:(\d+)/);
        if (match)
          lastFailure = { jobId: Number(match[2]), ended: moment(match[1]) };
      }
      const sql = `select * from nbu_sm9 where eventnode='${
        this.netBackup.masterServer
      }' and date>='${lastFailure.ended.format("YYYY-MM-DD HH:mm:ss")}';`;
      result = await database.execute(sql);
      result.sqlDuration = (moment() - startTime) / 1000;
      let i = 0;
      if (result.rows) {
        result.rows.forEach((row) => {
          if (new RegExp(this.filterJobTypes).test(row.jobtype)) return;
          if (new RegExp(this.filterPolicies).test(row.policy)) return;
          if (new RegExp(this.filterPolicyTypes).test(row.policytype)) return;
          if (new RegExp(this.filterStatuses).test(row.status)) return;
          if (
            lastFailure.ended.isSame(row.date) &&
            lastFailure.jobId >= row.jobid
          )
            return;
          let line = this.line;
          let messageText = this.messageText;
          row.date = moment(row.date).format("YYYY-MM-DD HH:mm:ss");
          Object.keys(row).forEach((key) => {
            const item = `<${key.toUpperCase()}>`;
            line = line.replace(item, row[key]);
            messageText = messageText.replace(item, row[key]);
          });
          line = line.replace(`<MESSAGETEXT>`, messageText);
          if (fs.existsSync(fileName)) {
            const stats = fs.statSync(fileName);
            const logHistory = process.env.NBU2SM9_LOG_HISTORY;
            const logRotTime = moment(process.env.NBU2SM9_LOGROT_TIME, "H");
            if (
              logRotTime.isAfter(stats.mtime) &&
              startTime.isAfter(logRotTime)
            ) {
              if (fs.existsSync(`${fileName}.${logHistory}`))
                fs.unlink(`${fileName}.${logHistory}`);
              for (let i = logHistory; i > 0; i--) {
                if (fs.existsSync(`${fileName}.${i}`))
                  fs.renameSync(`${fileName}.${i}`, `${fileName}.${i + 1}`);
              }
              fs.renameSync(`${fileName}`, `${fileName}.1`);
              cli.println("LogRot done.");
            }
          }
          cli.appendFile(fileName, line + "\n");
          i++;
        });
        result.rows = i;
      }
      result.duration = (moment() - startTime) / 1000;
      this.onResult(result);
    } catch (err) {
      cli.warn(cli.red(`Error: ${err.message}\n`));
      this.onError(err);
    }
    return this.status;
  }
  test() {
    const result = {
      source: this.constructor.name,
      status: undefined,
    };
    return new Promise((resolve, reject) => {
      fs.exists(this.path, (exists) => {
        if (exists) {
          result.status = "OK";
          resolve(result);
        } else {
          result.error = err.code;
          result.status = err.message;
          resolve(result);
        }
      });
    });
  }
}

module.exports = { Nbu2Sm9 };
