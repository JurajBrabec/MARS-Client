const dotenv = require("dotenv").config();

class NetBackup {
  constructor(options) {
    this.bin = options.data;
    this.data = options.data || options.path;
    this.masterServer = null;
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
}

var nbu = new NetBackup({
  bin: process.env.NBU_BIN,
  data: process.env.NBU_DATA,
});
module.exports = { nbu };

// SUMMARY

const tableDefinition = {
  bpdbjobs_summary: [
    { masterServer: /^Summary of jobs on (\S+)/m, key: true },
    { queued: /^Queued:\s+(\d+)/m },
    { waiting: /^Waiting-to-Retry:\s+(\d+)/m },
    { active: /^Active:\s+(\d+)/m },
    { successful: /^Successful:\s+(\d+)/m },
    { partial: /^Partially Successful:\s+(\d+)/m },
    { failed: /^Failed:\s+(\d+)/m },
    { incomplete: /^Incomplete:\s+(\d+)/m },
    { suspended: /^Suspended:\s+(\d+)/m },
    { total: /^Total:\s+(\d+)/m },
  ],
};

const { Tables } = require("./Tables");
//const { Process } = require("./TextParsers/Emitter");
const { Process } = require("./TextParsers/Readable");
const { Parser, Transform } = require("./TextParsers/Parser");

async function test() {
  const process = new Process({
    command: [nbu.bin, "bin/admincmd/bpdbjobs.exe"].join("/"),
    args: ["-summary", "-l"],
  });
  try {
    /*        const result = new Parser(await process.execute())
      .expect(/^Summary/)
      .match(new Tables(tableDefinition));
 */

    /*     const result = new Parser((source) =>
      source.expect(/^Summary/).match(new Tables(tableDefinition))
    ).parse(await process.execute());
 */

    //console.log(result);

    /*     const parser = new Parser(
      (source) => source.expect(/^Summary/).match(new Tables(tableDefinition)),
      { splitBuffer: /(\r?\n){2}/m }
    );
    await process
      .on("data", (data) => console.log(parser.buffer(data)))
      .on("exit", () => console.log(parser.flush()))
      .execute();
 */

    const parser = new Parser({
      actionChain: (source) =>
        source.expect(/^Summary/).match(new Tables(tableDefinition)),
      splitBuffer: /(\r?\n){2}/m,
    });
    const transform = new Transform({ parser });
    const stream = require("stream");
    const myWritable = new stream.Writable({
      objectMode: true,
      write(chunk, encoding, callback) {
        console.log(">", chunk);
        callback();
      },
    });
    process.pipe(transform).pipe(myWritable);
    await process.execute();
  } catch (error) {
    console.log("E:", error);
  } finally {
    console.log(process.status);
  }
}
test();

let text = "a b c d e f g h\ni j k l m n o p\nq r s t u w v x";
del = /(?=a|i|q)/;
//console.log(text.split(del));
