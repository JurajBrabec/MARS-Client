const dotenv = require('dotenv').config();
const Emitter = require('./Emitter.js');
const ESL = require('./ESL.js');
const File = require('./File.js');
const SM9 = require('./SM9.js');
const Stream = require('./Stream.js');
const BpdbJobs = require('./BpdbJobs.js');
const BpFlist = require('./BpFlist.js');
const BpimMedia = require('./BpimMedia.js');
const BpplClients = require('./BpplClients.js');
const BpplList = require('./BpplList.js');
const BpRetLevel = require('./BpRetLevel.js');
const NbDevQuery = require('./NbDevQuery.js');
const Nbstl = require('./Nbstl.js');
const VaultXml = require('./VaultXml.js');

class NetBackup {
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
  get masterServer() {
    return this._masterServer;
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
        const objects = await new Emitter({
          command: new BpdbJobs.Summary(this),
        }).run();
        this._masterServer = objects.bpdbjobs_summary[0].masterServer;
      } catch (error) {
        throw error;
      }
    return this;
  }
  async allClients() {
    await this.init();
    const clients = await new Emitter({
      command: new BpplClients.Clients(this),
    }).run();
    return clients.bpplclients.map((client) => client.name);
  }
  async clients(options = {}) {
    await this.init();
    options.command = new BpplClients.Clients(this);
    return new Stream(options);
  }
  async esl() {
    //    await this.init();
    return new ESL(this);
  }
  async files(options = { all: true }) {
    await this.init();
    if (options.all) {
      const clients = await this.allClients();
      options.command = new BpFlist.FilesAll(this, clients);
      return new Emitter(options);
    }
    if (options.backupId)
      options.command = new BpFlist.FilesBackupId(this, options.backupId);
    if (options.client)
      options.command = new BpFlist.FilesClient(this, options.client);
    return new Stream(options);
  }
  async images(options = { daysBack: 3 }) {
    await this.init();
    if (options.all) {
      const clients = await this.allClients();
      options.command = new BpimMedia.ImagesAll(this, clients);
      return new Emitter(options);
    }
    if (options.client)
      options.command = new BpimMedia.ImagesClient(this, options.client);
    if (options.daysBack)
      options.command = new BpimMedia.ImagesDaysBack(this, options.daysBack);
    return new Stream(options);
  }
  async jobs(options = { daysBack: 3 }) {
    if (options.all) options.command = new BpdbJobs.JobsAll(this);
    if (options.daysBack)
      options.command = new BpdbJobs.JobsDaysBack(this, options.daysBack);
    if (options.jobId)
      options.command = new BpdbJobs.JobId(this, options.jobId);
    return new Stream(options);
  }
  async policies(options = {}) {
    await this.init();
    options.command = new BpplList.Policies(this);
    return new Stream(options);
  }
  async pureDisks(options = {}) {
    await this.init();
    options.command = new NbDevQuery.PureDisks(this);
    return new Emitter(options);
  }
  async retlevels(options = {}) {
    await this.init();
    options.command = new BpRetLevel.Retlevels(this);
    return new Emitter(options);
  }
  async slps(options = {}) {
    await this.init();
    options.command = new Nbstl.SLPs(this);
    return new Emitter(options);
  }
  async summary(options = {}) {
    options.command = new BpdbJobs.Summary(this);
    return new Emitter(options);
  }
  async tickets() {
    //    await this.init();
    return new SM9(this);
  }
  async vaults(options = {}) {
    await this.init();
    options.command = new VaultXml.Vaults(this);
    return new File(options);
  }
}

module.exports = { NetBackup };
