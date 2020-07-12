const dotenv = require('dotenv').config();
const Emitter = require('./Emitter');
const File = require('./File');
const Stream = require('./Stream');
const bpdbjobs = require('./bpdbjobs');
const bpflist = require('./bpflist');
const bpimmedia = require('./bpimmedia');
const bpplclients = require('./bpplclients.js');
const bpplist = require('./bppllist.js');
const bpretlevel = require('./bpretlevel');
const nbdevquery = require('./nbdevquery');
const nbstl = require('./nbstl');
const vaultxml = require('./vaultxml');
class Nbu {
  constructor(params) {
    params = {
      ...{
        bin: process.env.NBU_BIN,
        data: process.env.NBU_DATA,
        startTime: new Date(),
      },
      ...params,
    };
    Object.assign(this, params);
    this._masterServer = null;
    return this;
  }
  dateTime(value) {
    const options = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
      //  timeZone: "America/Los_Angeles",
    };
    return new Intl.DateTimeFormat('en-US', options)
      .format(value)
      .replace(',', '');
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
  async allClients(options = {}) {
    await this.init();
    options.command = new bpplclients.Clients(this);
    const clients = await new Emitter(options).run();
    return clients;
  }
  async clients(options = {}) {
    await this.init();
    options.command = new bpplclients.Clients(this);
    return new Stream(options);
  }
  async files(options = {}) {
    await this.init();
    if (options.all) options.command = new bpflist.FilesAll(this); //TODO: all clients iteration
    if (options.backupId)
      options.command = new bpflist.FilesBackupId(this, options.backupId);
    if (options.client)
      options.command = new bpflist.FilesClient(this, options.client);
    return new Stream(options);
  }
  async images(options = { daysBack: 3 }) {
    await this.init();
    if (options.all) options.command = new bpimmedia.ImagesAll(this); //TODO: all clients iteration
    if (options.client)
      options.command = new bpimmedia.ImagesClient(this, options.client);
    if (options.days)
      options.command = new bpimmedia.ImagesDaysBack(this, options.days);
    return new Stream(options);
  }
  jobs(options = { daysBack: 3 }) {
    if (options.all) options.command = new bpdbjobs.JobsAll(this);
    if (options.daysBack)
      options.command = new bpdbjobs.JobsDaysBack(this, options.daysBack);
    if (options.jobId)
      options.command = new bpdbjobs.JobId(this, options.jobId);
    return new Stream(options);
  }
  async policies(options = {}) {
    await this.init();
    options.command = new bpplist.Policies(this);
    return new Stream(options);
  }
  async pureDisks(options = {}) {
    await this.init();
    options.command = new nbdevquery.PureDisks(this);
    return new Emitter(options);
  }
  async retlevels(options = {}) {
    await this.init();
    options.command = new bpretlevel.Retlevels(this);
    return new Emitter(options);
  }
  async slps(options = {}) {
    await this.init();
    options.command = new nbstl.SLPs(this);
    return new Emitter(options);
  }
  summary(options = {}) {
    options.command = new bpdbjobs.Summary(this);
    return new Emitter(options);
  }
  async vaults(options = {}) {
    await this.init();
    options.command = new vaultxml.Vaults(this);
    return new File(options);
  }
}

module.exports = { Nbu };
