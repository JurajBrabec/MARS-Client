const program = require("commander");
const util = require("util");
const cli = require("pixl-cli");
const { nbu } = require("../lib/netBackup");

async function init() {
  try {
    await nbu.init();
    program.command("summary").description("Read summary").action(readSummary);
    program
      .command("jobs")
      .description("Read jobs")
      .option("--days <days>", "Days to read", 1)
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
      .option("--client <client>", "Client to read")
      .option("--all", "All files to read")
      .action(readFiles);
    program
      .command("images")
      .description("Read images")
      .option("--days <days>", "Days to read")
      .option("--client <client>", "Client to read")
      .option("--all", "All files to read")
      .action(readImages);
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
  console.log(`Reading jobs ${cmd.days} days back...`);
  read(nbu.jobs({ days: cmd.days }));
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
  let args;
  if (cmd.backupid) {
    console.log(`Reading files for backup ID ${cmd.backupid}...`);
    args = { backupid: cmd.backupid };
  }
  if (cmd.client) {
    console.log(`Reading files for client ${cmd.client}...`);
    args = { client: cmd.client };
  }
  if (cmd.all) {
    console.log(`Reading all files...`);
    args = { all: true, concurrency: 10 };
  }
  if (args) {
    read(nbu.files(args));
  } else {
    console.log(`No argument given.`);
  }
}

function readImages(cmd) {
  let args;
  if (cmd.days) {
    console.log(`Reading images for ${cmd.days} back...`);
    args = { days: cmd.days };
  }
  if (cmd.client) {
    console.log(`Reading images for client ${cmd.client}...`);
    args = { client: cmd.client };
  }
  if (cmd.all) {
    console.log(`Reading all images...`);
    args = { all: true, concurrency: 10 };
  }
  if (args) {
    read(nbu.images(args));
  } else {
    console.log(`No argument given.`);
  }
}

function onProgress(progress) {
  //  console.log(`${progress.source}:${progress.message} (${progress.time}s)`);
  //console.log(progress);
  cli.progress.update({ amount: progress.done, max: progress.count });
}

async function read(source) {
  const { database } = require("../lib/Database");
  try {
    cli.progress.start({ exitOnSig: true });
    source.on("progress", onProgress);
    const result = await source.toDatabase(database);
    cli.progress.end();
    console.log(util.inspect(result, false, null, true));
    console.log(util.inspect(source.status, false, null, true));
  } catch (err) {
    cli.progress.end();
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
