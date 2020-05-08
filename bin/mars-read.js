const program = require("commander");
const cli = require("pixl-cli");
const { nbu } = require("../lib/netBackup");
const read = require("../lib/Mars").read;

async function init() {
  try {
    await nbu.init();
    program.command("summary").description("Read summary").action(readSummary);
    program
      .command("jobs")
      .description("Read jobs")
      .option("--days <days>", "Days to read", 1)
      .option("--jobid <jobid>", "Job ID to read")
      .option("--all", "All jobs to read")
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
    program.command("vaults").description("Read vaults").action(readVaults);
    program.parse(process.argv);
  } catch (err) {
    cli.print("Error: " + err.message);
  }
}

function readSummary() {
  cli.print(`Reading summary...`);
  read(nbu.summary());
}

function readJobs(cmd) {
  let args;
  if (cmd.all) delete cmd.days;
  if (cmd.days) {
    cli.print(`Reading jobs ${cmd.days} days back...`);
    args = { days: cmd.days };
  }
  if (cmd.jobid) {
    cli.print(`Reading job ID ${cmd.jobid} ...`);
    args = { jobid: cmd.jobid };
  }
  if (cmd.all) {
    cli.print(`Reading all jobs...`);
    args = { all: true };
  }
  if (args) {
    read(nbu.jobs(args));
  } else {
    cli.print(`No argument given.`);
  }
}

function readSlps() {
  cli.print(`Reading SLP's...`);
  read(nbu.slps());
}

function readClients() {
  cli.print(`Reading clients...`);
  read(nbu.clients());
}

function readPolicies() {
  cli.print(`Reading policies...`);
  read(nbu.policies());
}

function readRetLevels() {
  cli.print(`Reading retention levels...`);
  read(nbu.retLevels());
}

function readPureDisks() {
  cli.print(`Reading pure disks...`);
  read(nbu.pureDisks());
}

function readFiles(cmd) {
  let args;
  if (cmd.backupid) {
    cli.print(`Reading files for backup ID ${cmd.backupid}...`);
    args = { backupid: cmd.backupid };
  }
  if (cmd.client) {
    cli.print(`Reading files for client ${cmd.client}...`);
    args = { client: cmd.client };
  }
  if (cmd.all) {
    cli.print(`Reading all files...`);
    args = { all: true, concurrency: 10 };
  }
  if (args) {
    read(nbu.files(args));
  } else {
    cli.print(`No argument given.`);
  }
}

function readImages(cmd) {
  let args;
  if (cmd.days) {
    cli.print(`Reading images for ${cmd.days} back...`);
    args = { days: cmd.days };
  }
  if (cmd.client) {
    cli.print(`Reading images for client ${cmd.client}...`);
    args = { client: cmd.client };
  }
  if (cmd.all) {
    cli.print(`Reading all images...`);
    args = { all: true, concurrency: 10 };
  }
  if (args) {
    read(nbu.images(args));
  } else {
    cli.print(`No argument given.`);
  }
}

function readVaults() {
  cli.print(`Reading vaults...`);
  read(nbu.vaults());
}

init();
