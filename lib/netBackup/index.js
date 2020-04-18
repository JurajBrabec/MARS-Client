const dotenv = require("dotenv").config();
const { Command } = require("../Commands");
const { BpdbJobsSummary, BpdbJobsReport } = require("./BpdbJobs.js");
const { BpplClients } = require("./BpplClients");
const { BpplList } = require("./BpplList");
const { Nbstl } = require("./Nbstl");

class NetBackup extends Command {
  dbg = require("debug")("nbu");
  constructor(path) {
    super();
    this.params = { path };
    this._masterServer = null;
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
      this.masterServer = null;
      this.throwError(err);
    }
  }
  now() {
    return new Date().toISOString().slice(0, 19).replace("T", " ");
  }
  summary() {
    this.dbg("summary");
    return new BpdbJobsSummary(this);
  }

  jobs() {
    this.dbg("jobs");
    return new BpdbJobsReport(this);
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
