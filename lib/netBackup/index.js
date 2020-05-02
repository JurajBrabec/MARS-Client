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
  dateTime(value) {
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
      .format(value)
      .replace(",", "");
  }
  dateDiff(diffDays = 0) {
    return this.dateTime(new Date().setDate(new Date().getDate() + diffDays));
  }
  summary() {
    const { BpdbJobsSummary } = require("./BpdbJobs.js");
    this.dbg("summary");
    return new BpdbJobsSummary(this);
  }

  jobs(args) {
    this.dbg("jobs");
    let result;
    if (args.days) {
      const { BpdbJobsReportDays } = require("./BpdbJobs.js");
      result = new BpdbJobsReportDays(this, args.days);
    }
    if (args.jobid) {
      const { BpdbJobsReportJobId } = require("./BpdbJobs.js");
      result = new BpdbJobsReportJobId(this, args.jobid);
    }
    if (args.all) {
      const { BpdbJobsReportAll } = require("./BpdbJobs.js");
      result = new BpdbJobsReportAll(this);
    }
    return result;
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
      const { BpFlistAll } = require("./BpFlist");
      result = new BpFlistAll(this, args.concurrency);
    }
    return result;
  }
  images(args) {
    this.dbg("images");
    let result;
    if (args.days) {
      const { BpimMediaDays } = require("./BpimMedia");
      result = new BpimMediaDays(this, args.days);
    }
    if (args.client) {
      const { BpimMediaClient } = require("./BpimMedia");
      result = new BpimMediaClient(this, args.client);
    }
    if (args.all) {
      const { BpimMediaAll } = require("./BpimMedia");
      result = new BpimMediaAll(this, args.concurrency);
    }
    return result;
  }
  vaults() {
    this.dbg("vaults");
    const { VaultXml } = require("./VaultXml");
    return new VaultXml(this);
  }
  test() {
    return Promise.all([
      this.summary().test(),
      this.jobs({ days: 1 }).test(),
      this.clients().test(),
      this.slps().test(),
      this.policies().test(),
      this.retLevels().test(),
      this.pureDisks().test(),
      this.files({ all: true }).test(),
      this.images({ days: 1 }).test(),
      this.vaults().test(),
    ]);
  }
}

var nbu = nbu || new NetBackup(process.env.NBU_HOME);
module.exports = { nbu };
