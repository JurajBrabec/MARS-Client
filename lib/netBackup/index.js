const dotenv = require("dotenv").config();
const debug = require("debug");
const { Command } = require("../Command");

class NetBackup extends Command {
  constructor(path) {
    super();
    this.startTime = new Date();
    this.path = path;
    this._masterServer = null;
    this.dbg = debug("command:netbackup");
  }
  get masterServer() {
    this.dbg("getMasterServer");
    return this._masterServer;
  }
  set masterServer(name) {
    this.dbg("setMasterServer");
    this._masterServer = name;
  }
  async init() {
    if (this.masterServer) this.successEnd(this);
    this.dbg("init");
    try {
      const { BpdbJobsSummary } = require("./BpdbJobs.js");
      const obj = await new BpdbJobsSummary(this).asObjects();
      this.masterServer = obj[0].bpdbjobs_summary.masterServer;
      this.successEnd(this);
    } catch (err) {
      this.masterServer = null;
      this.throwError(err);
      throw err;
    }
  }
  now() {
    return new Date().toISOString().slice(0, 19).replace("T", " ");
  }
  timeStamp(diffDays = 0) {
    const options = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
      //  timeZone: "America/Los_Angeles",
    };
    return new Intl.DateTimeFormat("en-US", options)
      .format(new Date().setDate(new Date().getDate() + diffDays))
      .replace(",", "");
  }
  summary() {
    const { BpdbJobsSummary } = require("./BpdbJobs.js");
    this.dbg("summary");
    return new BpdbJobsSummary(this);
  }

  jobs(days) {
    const { BpdbJobsReport } = require("./BpdbJobs.js");
    this.dbg("jobs");
    return new BpdbJobsReport(this, days);
  }
  slps() {
    this.dbg("slps");
    const { Nbstl } = require("./Nbstl");
    return new Nbstl(this);
  }
  clients() {
    this.dbg("clients");
    const { BpplClients } = require("./BpplClients");
    return new BpplClients(this);
  }
  policies() {
    this.dbg("policies");
    const { BpplList } = require("./BpplList");
    return new BpplList(this);
  }
  retLevels() {
    this.dbg("retention levels");
    const { BpRetLevel } = require("./BpRetLevel");
    return new BpRetLevel(this);
  }
  pureDisks() {
    this.dbg("pure disks");
    const { NbDevQueryListDvPureDisk } = require("./NbDevQuery");
    return new NbDevQueryListDvPureDisk(this);
  }
  files(args) {
    this.dbg("files");
    let result;
    if (args.backupid) {
      const { BpFlistBackupId } = require("./BpFlist");
      result = new BpFlistBackupId(this, args.backupid);
    }
    if (args.client) {
      const { BpFlistClient } = require("./BpFlist");
      result = new BpFlistClient(this, args.client);
    }
    if (args.all) {
      const { BpplClients } = require("./BpplClients");
      const { BpFlistAll } = require("./BpFlist");
      result = new BpFlistAll(this, args.concurrency);
    }
    return result;
  }
}

var nbu = nbu || new NetBackup(process.env.NBU_HOME);
module.exports = { nbu };

async function test() {
  const util = require("util");
  const { database } = require("../Database");
  try {
    await nbu.init();
    const result = await nbu
      .files({ all: true, concurrency: 10 })
      .toDatabase(database);
    console.log(util.inspect(result, false, null, true));
  } catch (err) {
    if (
      err instanceof SyntaxError ||
      err instanceof ReferenceError ||
      err instanceof TypeError
    )
      throw err;
    console.log("Error: " + err.message);
  } finally {
    await database.pool.end();
  }
}
if (require.main === module) test();
