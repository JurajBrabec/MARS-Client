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
const { Process } = require("./TextParsers/Emitter");
const { Text } = require("./TextParsers/Transform");

async function test() {
  const process = new Process({
    encoding: "utf8",
    objectMode: true,
    command: [nbu.bin, "bin/admincmd/bpdbjobs.exe"].join("/"),
    args: ["-summary", "-l"],
  });
  try {
    /*        const result = new Text(await process.execute())
      .expect(/^Summary/)
      .match(new Tables(tableDefinition));
 */

    const result = new Text(function () {
      return this.expect(/^Summary/).match(new Tables(tableDefinition));
    }).transform(await process.execute());

    console.log(result);
  } catch (error) {
    console.log(error);
  } finally {
    console.log(process.status);
  }
}

test();

function testLiteralStrings() {
  function literalString(strings, ...params) {
    return { strings, params };
  }
  const p1 = "p1";
  const p2 = "p2";
  const s = literalString`s1 ${p1} s2 ${p2} s3`;
  console.log({ s });
}

function testNew() {
  const t1 = {
    table1: [
      { field1: /^(\w+)/, key: true },
      { field2: / (\w+)/, key: true },
    ],
  };
  const t2 = {
    table2: [
      { field1: "string", key: true },
      { field2: "string", key: true },
    ],
  };
  const t3 = {
    table3: [{ field1: "number", key: true }, { field2: "number" }],
  };

  const output = `aa bb 11\ncc dd 22\nee ff 33`;
  const rows1 = new Text(output).split("\n").match(new Tables(t1));
  const rows2 = new Text(output)
    .split("\n")
    .split(" ")
    .assign(new Tables([t2, t3]));

  console.log("\nTransformed rows:");
  console.log(rows1);
  console.log(rows2);
}
