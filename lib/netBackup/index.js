const dotenv = require("dotenv").config();
const { Command } = require("../Commands");
const { BpdbJobsSummary, BpdbJobsReport } = require("./BpdbJobs.js");
const { BpplClients } = require("./BpplClients");
const { BpplList } = require("./BpplList");
const { Nbstl } = require("./Nbstl");

class NetBackup extends Command {
  constructor(path, pool) {
    super();
    this.params = { path, pool };
    this._masterServer = null;
    this.init();
  }
  get masterServer() {
    return this._masterServer;
  }
  set masterServer(name) {
    this._masterServer = name;
  }
  async init() {
    if (this.masterServer) this.successEnd(this);
    try {
      const obj = await this.summary().asObjects();
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
    return new BpdbJobsSummary(this);
  }

  jobs() {
    return new BpdbJobsReport(this);
  }
  slps() {
    return new Nbstl(this);
  }
  clients() {
    return new BpplClients(this);
  }
  policies() {
    return new BpplList(this);
  }
}

var nbu = nbu || new NetBackup(process.env.NBU_HOME);
module.exports = { nbu };
