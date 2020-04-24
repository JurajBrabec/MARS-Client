const program = require("commander");
const util = require("util");
const { nbu } = require("../lib/netBackup");

async function init() {
  try {
    await nbu.init();
    program.command("summary").description("Read summary").action(readSummary);
    program
      .command("jobs")
      .description("Read jobs")
      .option("--days <days>", "Days to read", 7)
      .action(readJobs);
    program.command("slps").description("Read SLP's").action(readSlps);
    program.command("clients").description("Read clients").action(readClients);
    program
      .command("policies")
      .description("Read policies")
      .action(readPolicies);
    program
      .command("retlevels")
      .description("Read retention levels")
      .action(readRetLevels);
    program
      .command("puredisks")
      .description("Read pure disks")
      .action(readPureDisks);
    program
      .command("files")
      .description("Read files")
      .option("--backupid <backupId>", "Backup ID to read")
      .action(readFiles);
    program.parse(process.argv);
  } catch (err) {
    console.log("Error: " + err.message);
  }
}

function readSummary() {
  console.log(`Reading summary...`);
  read(nbu.summary());
}

function readJobs(cmd) {
  console.log(`Reading jobs (${cmd.days} days)...`);
  read(nbu.jobs(cmd.days));
}

function readSlps() {
  console.log(`Reading SLP's...`);
  read(nbu.slps());
}

function readClients() {
  console.log(`Reading clients...`);
  read(nbu.clients());
}

function readPolicies() {
  console.log(`Reading policies...`);
  read(nbu.policies());
}

function readRetLevels() {
  console.log(`Reading retention levels...`);
  read(nbu.retLevels());
}

function readPureDisks() {
  console.log(`Reading pure disks...`);
  read(nbu.pureDisks());
}

function readFiles(cmd) {
  console.log(`Reading files for ${cmd.backupid}...`);
  read(nbu.files(cmd.backupid));
}

async function read(source) {
  const { database } = require("../lib/Database");
  try {
    const result = await source.toDatabase(database);
    console.log(util.inspect(result, false, null, true));
  } catch (err) {
    if (
      err instanceof SyntaxError ||
      err instanceof ReferenceError ||
      err instanceof TypeError
    )
      throw err;
    console.log("Error: " + err.message);
  } finally {
    await database.pool.end();
  }
}
init();
