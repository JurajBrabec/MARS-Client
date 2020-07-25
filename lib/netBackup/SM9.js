const cli = require('pixl-cli');
const fs = require('fs');
const moment = require('moment');
const path = require('path');
const Database = require('../Database');
const { Emitter } = require('../Emitter');

class SM9 extends Emitter {
  constructor(netBackup) {
    super();
    this.description = 'Writing SM9 tickets...';
    this.netBackup = netBackup;
    this.fileName = 'mars_mon.log';
    this.path = process.env.NBU2SM9_PATH;
    this.title = 'Writing tickets';
    this.line = `<DATE>::<SEVERITY>::<ERRORCODE>::<MESSAGETEXT>::<EVENTNODE>::<EVENTTYPEINSTANCE>::<CORELLATIONKEY>`;
    this.messageText = `<POLICYTYPE> <JOBTYPE> policy "<POLICY>" <STATUSTEXT>. <STATE> with JobID:<JOBID> schedule "<SCHEDULE>" client <CLIENT> status <ERRORCODE> (<ERRORTEXT>)`;
    this.filterJobTypes = process.env.NBU2SM9_FILTER_JOBTYPES || 'none';
    this.filterPolicyTypes = process.env.NBU2SM9_FILTER_POLICYTYPES || 'none';
    this.filterPolicies = process.env.NBU2SM9_FILTER_POLICIES || 'none';
    this.filterStatuses = process.env.NBU2SM9_FILTER_STATUSES || 'none';
    this.logHistory = process.env.NBU2SM9_LOG_HISTORY || 7;
    this.logRotTime = moment(process.env.NBU2SM9_LOGROT_TIME || '12:00', 'H');
  }
  async _run() {
    let result;
    try {
      if (!fs.existsSync(this.path)) fs.mkdirSync(this.path);
      const fileName = path.join(this.path, this.fileName);
      let lastFailure = { jobId: 0, ended: moment().subtract(1, 'hour') };
      if (fs.existsSync(fileName)) {
        const contents = fs.readFileSync(fileName, 'utf8');
        const [lastLine] = contents.trim().split('\n').slice(-1);
        const match = lastLine.match(/^(.+?)::.+JobID:(\d+)/);
        if (match)
          lastFailure = { jobId: Number(match[2]), ended: moment(match[1]) };
      }
      const sql = `select * from nbu_sm9 where eventnode='${
        this.netBackup.masterServer
      }' and date>='${lastFailure.ended.format('YYYY-MM-DD HH:mm:ss')}';`;
      result = await Database.query(sql);
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
          row.date = moment(row.date).format('YYYY-MM-DD HH:mm:ss');
          Object.keys(row).forEach((key) => {
            const item = `<${key.toUpperCase()}>`;
            line = line.replace(item, row[key]);
            messageText = messageText.replace(item, row[key]);
          });
          line = line.replace(`<MESSAGETEXT>`, messageText);
          if (fs.existsSync(fileName)) this.logRot(fileName);
          cli.appendFile(fileName, line + '\n');
          i++;
        });
        cli.println(`${fileName} created`);
      }
      this.end();
    } catch (err) {
      this.error(err);
    }
  }
  asBatch() {
    return this;
  }
  logRot(fileName) {
    const startTime = this.netBackup.startTime;
    const stats = fs.statSync(fileName);
    if (
      this.logRotTime.isAfter(stats.mtime) &&
      startTime.isAfter(this.logRotTime)
    ) {
      if (fs.existsSync(`${fileName}.${this.logHistory}`))
        fs.unlink(`${fileName}.${this.logHistory}`);
      for (let i = this.logHistory; i > 0; i--) {
        if (fs.existsSync(`${fileName}.${i}`))
          fs.renameSync(`${fileName}.${i}`, `${fileName}.${i + 1}`);
      }
      fs.renameSync(`${fileName}`, `${fileName}.1`);
      cli.println('LogRot done.');
    }
  }
}

module.exports = SM9;
