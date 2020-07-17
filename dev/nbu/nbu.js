const dotenv = require('dotenv').config();
const Database = require('../Database');
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
        const objects = await new Emitter({
          command: new bpdbjobs.Summary(this),
        }).run();
        this._masterServer = objects.bpdbjobs_summary[0].masterServer;
      } catch (error) {
        throw error;
      }
    return this;
  }
  async end() {
    await Database.end();
  }
  get masterServer() {
    return this._masterServer;
  }
  async allClients(options = {}) {
    await this.init();
    options.command = new bpplclients.Clients(this);
    return await new Emitter(options).run();
  }
  async clients(options = {}) {
    await this.init();
    options.command = new bpplclients.Clients(this);
    return await new Stream(options)
      .on('data', async (data) => console.log(await Database.batch(data)))
      .run();
  }
  async files(options = { all: true }) {
    await this.init();
    if (options.all) {
      const clients = (await this.allClients()).bpplclients.map(
        (client) => client.name
      );
      options.command = new bpflist.FilesAll(this, clients);
      return await new Emitter(options)
        .asBatch(2048)
        .on('data', async (data) => console.log(await Database.batch(data)))
        .on('progress', (progress) => console.log(progress))
        .run();
    }
    if (options.backupId)
      options.command = new bpflist.FilesBackupId(this, options.backupId);
    if (options.client)
      options.command = new bpflist.FilesClient(this, options.client);
    return await new Stream(options)
      .on('data', async (data) => console.log(await Database.batch(data)))
      .run();
  }
  async images(options = { daysBack: 3 }) {
    await this.init();
    if (options.all) {
      const clients = (await this.allClients()).bpplclients.map(
        (client) => client.name
      );
      options.command = new bpimmedia.ImagesAll(this, clients);
      return await new Emitter(options)
        .asBatch(2048)
        .on('data', async (data) => console.log(await Database.batch(data)))
        .on('progress', (progress) => console.log(progress))
        .run();
    }
    if (options.client)
      options.command = new bpimmedia.ImagesClient(this, options.client);
    if (options.daysBack)
      options.command = new bpimmedia.ImagesDaysBack(this, options.daysBack);
    return await new Stream(options)
      .on('data', async (data) => console.log(await Database.batch(data)))
      .run();
  }
  async jobs(options = { daysBack: 3 }) {
    if (options.all) options.command = new bpdbjobs.JobsAll(this);
    if (options.daysBack)
      options.command = new bpdbjobs.JobsDaysBack(this, options.daysBack);
    if (options.jobId)
      options.command = new bpdbjobs.JobId(this, options.jobId);
    return await new Stream(options)
      .on('data', async (data) => console.log(await Database.batch(data)))
      .run();
  }
  async policies(options = {}) {
    await this.init();
    options.command = new bpplist.Policies(this);
    return await new Stream(options)
      .on('data', async (data) => console.log(await Database.batch(data)))
      .run();
  }
  async pureDisks(options = {}) {
    await this.init();
    options.command = new nbdevquery.PureDisks(this);
    const objects = await new Emitter(options).asBatch(2048).run();
    return await Database.batch(objects);
  }
  async retlevels(options = {}) {
    await this.init();
    options.command = new bpretlevel.Retlevels(this);
    const objects = await new Emitter(options).asBatch(2048).run();
    return await Database.batch(objects);
  }
  async slps(options = {}) {
    await this.init();
    options.command = new nbstl.SLPs(this);
    const objects = await new Emitter(options).asBatch(2048).run();
    return await Database.batch(objects);
  }
  async summary(options = {}) {
    options.command = new bpdbjobs.Summary(this);
    const objects = await new Emitter(options).asBatch().run();
    return await Database.batch(objects);
  }
  async vaults(options = {}) {
    await this.init();
    options.command = new vaultxml.Vaults(this);
    const objects = await new File(options).asBatch(2048).run();
    return await Database.batch(objects);
  }
}

module.exports = { Nbu };
