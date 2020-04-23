const dotenv = require("dotenv").config();
const debug = require("debug");
const { Command } = require("../Command");
const { BpdbJobsSummary, BpdbJobsReport } = require("./BpdbJobs.js");
const { BpplClients } = require("./BpplClients");
const { BpplList } = require("./BpplList");
const { Nbstl } = require("./Nbstl");

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
      const obj = await new BpdbJobsSummary(this).asObjects();
      this.masterServer = obj[0].bpdbjobs_summary.masterServer;
      this.successEnd(this);
    } catch (err) {
      if (
        err instanceof SyntaxError ||
        err instanceof ReferenceError ||
        err instanceof TypeError
      )
        throw err;
      this.masterServer = null;
      this.throwError(err);
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
    this.dbg("summary");
    return new BpdbJobsSummary(this);
  }

  jobs(days) {
    this.dbg("jobs");
    return new BpdbJobsReport(this, days);
  }
  slps() {
    this.dbg("slps");
    return new Nbstl(this);
  }
  clients() {
    this.dbg("clients");
    return new BpplClients(this);
  }
  policies() {
    this.dbg("policies");
    return new BpplList(this);
  }
}

var nbu = nbu || new NetBackup(process.env.NBU_HOME);
module.exports = { nbu };

async function test() {
  const util = require("util");
  try {
    await nbu.init();
    //    const { pool } = require("../lib/Database");
    const result = await nbu.jobs().asObjects();
    console.log(result.filter((item) => item.bpdbjobs_report.kbpersec == 70));
    //    console.log(util.inspect(result, false, null, true));
  } catch (err) {
    if (
      err instanceof SyntaxError ||
      err instanceof ReferenceError ||
      err instanceof TypeError
    )
      throw err;
    console.log("Error: " + err.message);
  } finally {
    //    await pool.end();
  }
}
//test();
