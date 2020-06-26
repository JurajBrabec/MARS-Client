const dotenv = require("dotenv").config();
const Emitter = require("./Emitter");
const Stream = require("./Stream");
const bpdbjobs = require("./bpdbjobs");
const bpflist = require("./bpflist");
const bpimmedia = require("./bpimmedia");
const bpplclients = require("./bpplclients.js");
class Nbu {
  constructor() {
    this.bin = process.env.NBU_BIN;
    this.data = process.env.NBU_DATA;
    this.startTime = new Date();
    this._masterServer = null;
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
  async init() {
    if (!this._masterServer)
      try {
        const objects = await this.summary().run();
        this._masterServer = objects.bpdbjobs_summary[0].masterServer;
      } catch (error) {
        throw error;
      }
    return this;
  }
  get masterServer() {
    return this._masterServer;
  }
  async clients(options = {}) {
    await this.init();
    options.command = new bpplclients.Clients(this);
    return new Stream(options);
  }
  async files(options = {}) {
    await this.init();
    options.command = new bpflist.Files(this);
    return new Stream(options);
  }
  async images(options = {}) {
    await this.init();
    options.command = new bpimmedia.Images(this);
    return new Stream(options);
  }
  jobs(options = { daysBack: 3 }) {
    if (options.daysBack)
      options.command = new bpdbjobs.JobsDaysBack(this, options.daysBack);
    if (options.jobId)
      options.command = new bpdbjobs.JobId(this, options.jobId);
    if (options.all) options.command = new bpdbjobs.JobsAll(this);
    return new Stream(options);
  }
  summary(options = {}) {
    options.command = new bpdbjobs.Summary(this);
    return new Emitter(options);
  }
}

module.exports = { Nbu };
