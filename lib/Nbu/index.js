const dotenv = require("dotenv").config();
const {
  EmitterProcess,
  Parser,
  ReadableProcess,
  TransformParser,
} = require("../TextParsers");
const Tables = require("../Tables");

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
    return this;
  }
  get masterServer() {
    if (this._masterServer) return this._masterServer;
    return new Promise((resolve, reject) => {
      this.summary({ status: false })
        .then((batch) => {
          this._masterServer = batch[0].bpdbjobs_summary.rows[0].masterServer;
          resolve(this._masterServer);
        })
        .catch((error) => reject(error));
    });
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
  _progress(progress) {
    console.log("Progress:", progress);
  }
  _status(status) {
    console.log("Status:", status);
  }
  _emitterProcess({ binary, structure, data, status = true }) {
    const tables = Tables.create(data).asBatch(256).get();
    const parser = new Parser(structure);
    let batch = [];
    const proc = new EmitterProcess(binary);
    return new Promise((resolve, reject) => {
      if (status) proc.on("exit", (status) => this._status(status));
      proc
        .on("progress", (progress) => this._progress(progress))
        .execute()
        .then((output) => {
          batch = parser.parse(output) || batch;
          if (Tables.use(tables).dirty())
            batch.push(Tables.use(tables).flush());
          resolve(batch);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
  _readableProcess({ binary, structure, data, status = true }) {
    const tables = Tables.create(data).asBatch(2048).get();
    const parser = new Parser(structure);
    const proc = new ReadableProcess(binary);
    if (status) proc.on("exit", (status) => this._status(status));
    proc
      .on("progress", (progress) => this._progress(progress))
      .pipe(new TransformParser({ parser }))
      .pipe(this._pipe);
    return proc.execute();
  }
  pipe(target) {
    this._pipe = target;
    return this;
  }
  summary({ status }) {
    const Bpdbjobs = require("./Bpdbjobs")({ nbu, target: Tables });
    return this._emitterProcess({ ...Bpdbjobs.Summary, status });
  }
  jobs({ days, jobId }) {
    const Bpdbjobs = require("./Bpdbjobs")({ nbu, target: Tables });
    const args = Bpdbjobs.Jobs.binary.args;
    if (days) args.push("-t", ...this.dateDiff(-days).split(" "));
    if (jobId) args.push("-jobid", jobId);
    return this._readableProcess(Bpdbjobs.Jobs);
  }
  files({ backupId, client }) {
    const Bpflist = require("./Bpflist")({ nbu, target: Tables });
    const args = Bpflist.Files.binary.args;
    if (backupId) args.push("-backupId", backupId);
    if (client) args.push("-client", client);
    return this._readableProcess(Bpflist.Files);
  }
  media({ days, client }) {
    const Bpimmedia = require("./Bpimmedia")({ nbu, target: Tables });
    const args = Bpimmedia.Files.binary.args;
    if (days) args.push("-d", ...this.dateDiff(-days).split(" "));
    if (client) args.push("-client", client);
    return this._readableProcess(Bpflist.Files);
  }
  clients({ status }) {
    const Bpplclients = require("./Bpplclients")({ nbu, target: Tables });
    return this._emitterProcess({ ...Bpplclients.Clients, status });
  }
  clients1() {
    this.clients({ status: false }).then((batch) => {
      let i = 0;
      batch.forEach((insert) =>
        insert.bpplclients.rows.forEach((client) => i++)
      );
      console.log("Clients:", i);
    });
  }
}

var nbu = nbu || new Nbu();
module.exports = nbu;
