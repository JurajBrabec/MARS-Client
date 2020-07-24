const commander = require("commander");
const cli = require("pixl-cli");
const { nbu } = require("../lib/netBackup");
const { Database } = require("../lib/Database");

const command = new commander.Command("exec").description("Execution");
command.command("summary").description("Read summary").action(execSummary);
command.command("clients").description("Read clients").action(execClients);
command.command("policies").description("Read policies").action(execPolicies);
command.command("slps").description("Read SLP's").action(execSlps);
command.command("vaults").description("Read vaults").action(execVaults);
command
  .command("puredisks")
  .description("Read pure disks")
  .action(execPureDisks);
command
  .command("retlevels")
  .description("Read retention levels")
  .action(execRetLevels);
command
  .command("files")
  .description("Read files")
  .option("-a,--all", "All files to read")
  .option("-c,--client <client>", "Client to read")
  .option("-i,--backupid <backupId>", "Backup ID to read")
  .action(execFiles);
command
  .command("images")
  .description("Read images")
  .option("-a,--all", "All files to read")
  .option("-c,--client <client>", "Client to read")
  .option("-d,--days <days>", "Days to read")
  .action(execImages);
command
  .command("jobs")
  .description("Read jobs")
  .option("-a,--all", "All jobs to read")
  .option("-d,--days <days>", "Days to read", 1)
  .option("-j,--jobid <jobid>", "Job ID to read")
  .action(execJobs);
command.command("tickets").description("Write vaults").action(execTickets);
command.command("esl").description("Write ESL information").action(execEsl);

module.exports = { command, execute };

async function execSummary() {
  await nbu.init();
  execute(nbu.summary());
}

async function execSlps() {
  await nbu.init();
  execute(nbu.slps());
}

async function execClients() {
  await nbu.init();
  execute(nbu.clients());
}

async function execPolicies() {
  await nbu.init();
  execute(nbu.policies());
}

async function execRetLevels() {
  await nbu.init();
  execute(nbu.retLevels());
}

async function execPureDisks() {
  await nbu.init();
  execute(nbu.pureDisks());
}

async function execVaults() {
  await nbu.init();
  execute(nbu.vaults());
}

async function execJobs(cmd) {
  let args;
  if (cmd.all) delete cmd.days;
  if (cmd.days) args = { days: cmd.days };
  if (cmd.jobid) args = { jobid: cmd.jobid };
  if (cmd.all) args = { all: true };
  if (args) {
    await nbu.init();
    execute(nbu.jobs(args));
  } else {
    cli.println(`No argument given.`);
  }
}

async function execFiles(cmd) {
  let args;
  if (cmd.backupid) args = { backupid: cmd.backupid };
  if (cmd.client) args = { client: cmd.client };
  if (cmd.all) args = { all: true, concurrency: 10 };
  if (args) {
    await nbu.init();
    execute(nbu.files(args));
  } else {
    cli.println(`No argument given.`);
  }
}

async function execImages(cmd) {
  let args;
  if (cmd.days) args = { days: cmd.days };
  if (cmd.client) args = { client: cmd.client };
  if (cmd.all) args = { all: true, concurrency: 10 };
  if (args) {
    await nbu.init();
    execute(nbu.images(args));
  } else {
    cli.println(`No argument given.`);
  }
}

async function execTickets() {
  await nbu.init();
  execute(nbu.tickets());
}

async function execEsl() {
  await nbu.init();
  execute(nbu.esl());
}

function onProgress(progress) {
  cli.progress.update({
    amount: progress.done,
    max: progress.count,
    width: cli.width() - 40,
  });
}
function onFinish(status) {
  cli.progress.erase();
  cli.println(
    `Finished ${cli.green(status.commands)} ${cli.pluralize(
      "command",
      status.commands
    )} in ${cli.getTextFromSeconds(status.duration)}, ${cli.green(
      status.sqls
    )} ${cli.pluralize("SQL", status.sqls)} in ${cli.getTextFromSeconds(
      status.sqlDuration
    )}, (${cli.green(status.rows)} rows, ${
      status.warnings ? cli.yellow(status.warnings) : cli.green(0)
    } warnings, ${
      status.errors ? cli.red(status.errors) : cli.green(0)
    } errors)`
  );
  if (status.errors)
    status.messages.map((message) =>
      cli.warn(`${cli.bold.red(message.error)}:${message.message}\n`)
    );
}
function progressStart() {
  cli.progress.start({
    exitOnSig: true,
    catchCrash: true,
    unicode: true,
    width: cli.width() - 40,
    braces: ["[", "]"],
    styles: {
      spinner: ["bold", "green"],
      braces: ["bold", "white"],
      bar: ["gray"],
      pct: ["green"],
      remain: ["green"],
    },
  });
}
async function execute(source) {
  const database = new Database();
  try {
    cli.println(`${source.title}...`);
    progressStart();
    source.on("progress", onProgress);
    const result = await source.toDatabase(database);
    onFinish(result);
  } catch (err) {
    cli.progress.erase();
    if (
      err instanceof SyntaxError ||
      err instanceof ReferenceError ||
      err instanceof TypeError
    )
      throw err;
    cli.warn(cli.red(`Error: ${err.message}\n`));
  } finally {
    cli.progress.end();
    await database.pool.end();
  }
}
